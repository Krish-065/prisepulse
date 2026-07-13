const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { query } = require('../db/index');
const crypto = require('crypto');

// 1. Fetch community feed posts
router.get('/posts', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, u.name as author_name 
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch posts error:', err);
    res.status(500).json({ error: 'Failed to retrieve community posts' });
  }
});

// 2. Create new post
router.post('/posts', authenticate, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const postId = crypto.randomUUID();
    await query(
      `INSERT INTO community_posts (id, user_id, title, content, likes) VALUES ($1, $2, $3, $4, 0)`,
      [postId, req.user.id, title, content]
    );

    const result = await query(`
      SELECT p.*, u.name as author_name 
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `, [postId]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Failed to publish post' });
  }
});

// 3. Like a post
router.post('/posts/:id/like', authenticate, async (req, res) => {
  try {
    await query(`UPDATE community_posts SET likes = likes + 1 WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Like post error:', err);
    res.status(500).json({ error: 'Failed to register like' });
  }
});

// 4. Fetch courses
router.get('/courses', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM courses ORDER BY created_at ASC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch courses error:', err);
    res.status(500).json({ error: 'Failed to retrieve courses' });
  }
});

// 5. Fetch contests
router.get('/contests', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM contests ORDER BY id ASC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch contests error:', err);
    res.status(500).json({ error: 'Failed to retrieve contests' });
  }
});

// 6. Join a contest
router.post('/contests/:id/join', authenticate, async (req, res) => {
  try {
    await query(`UPDATE contests SET participants = participants + 1 WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Join contest error:', err);
    res.status(500).json({ error: 'Failed to join contest' });
  }
});

// 7. Fetch group messages
router.get('/chat/:groupId', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Check group info
    const groupInfo = await query(`SELECT created_by FROM discussion_groups WHERE id = $1`, [groupId]);
    if (groupInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // If private, verify current user is a member
    if (groupInfo.rows[0].created_by !== null) {
      const memberCheck = await query(
        `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
        [groupId, req.user.id]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied: you are not a member of this private group' });
      }
    }

    let result = await query(
      `SELECT * FROM group_messages WHERE group_id = $1 ORDER BY created_at ASC LIMIT 50`,
      [groupId]
    );

    // Seed default chat messages if the room is empty to show active discussions (for public rooms only)
    if (result.rows.length === 0 && groupInfo.rows[0].created_by === null) {
      const defaultChats = {
        nifty: [
          { author: 'AlgorithmicGuru', msg: 'Check out RSI crosses below 30 on RELIANCE! Looks like a great entry point.' },
          { author: 'NiftyTrader', msg: 'Yeah, EMA 20 is still pointing down though, better wait for a crossover.' },
          { author: 'BeginnerInvest', msg: 'Should we run a backtest on Nifty index breakouts first?' },
          { author: 'QuantPro', msg: 'Definitely. Breakouts above the 30-day resistance work nicely in current market conditions.' }
        ],
        options: [
          { author: 'F&OScalper', msg: 'Nifty Put-Call Ratio (PCR) is sitting at 0.76. Looks oversold.' },
          { author: 'ThetaDecay', msg: 'Time to sell weekly OTM puts if you have the margin.' },
          { author: 'OptionStudent', msg: 'Isn\'t selling options risky for beginners?' },
          { author: 'ThetaDecay', msg: 'Extremely! Stick to paper trading here until you master risk management.' }
        ],
        basics: [
          { author: 'PrisePulseMentor', msg: 'Welcome to Investing Basics! Ask anything about indicators or stock terminologies.' },
          { author: 'Newbie99', msg: 'What does "Spread" mean in bid-ask quotes?' },
          { author: 'PrisePulseMentor', msg: 'It is the difference between the highest price a buyer is willing to pay (bid) and the lowest price a seller is willing to accept (ask).' }
        ],
        crypto: [
          { author: 'CryptoWhale', msg: 'BTC holding strong above key support of $60K.' },
          { author: 'SatoshisSon', msg: 'ADX index is indicating high trend strength. Bull run might resume.' },
          { author: 'AltSeasonWhen', msg: 'Wait for ETH to crossover its 50-day EMA first.' }
        ]
      };

      const seedMessages = defaultChats[groupId] || [];
      for (const m of seedMessages) {
        await query(
          `INSERT INTO group_messages (id, group_id, user_id, author_name, message) VALUES ($1,$2,NULL,$3,$4)`,
          [crypto.randomUUID(), groupId, m.author, m.msg]
        );
      }

      // Re-fetch seeded messages
      result = await query(
        `SELECT * FROM group_messages WHERE group_id = $1 ORDER BY created_at ASC LIMIT 50`,
        [groupId]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Fetch group messages error:', err);
    res.status(500).json({ error: 'Failed to retrieve group messages' });
  }
});

// 8. Send group message
router.post('/chat/:groupId', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Check group info
    const groupInfo = await query(`SELECT created_by, features FROM discussion_groups WHERE id = $1`, [groupId]);
    if (groupInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check group membership / roles
    let role = null;
    if (groupInfo.rows[0].created_by !== null) {
      const memberCheck = await query(
        `SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2`,
        [groupId, req.user.id]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied: you are not a member of this private group' });
      }
      role = memberCheck.rows[0].role;
    } else {
      role = 'member'; // treat everyone as a member in public room
    }

    // Enforce admin-only posting rules
    if (groupInfo.rows[0].features === 'admin-only-chat') {
      if (groupInfo.rows[0].created_by !== null && role !== 'admin') {
        return res.status(403).json({ error: 'Only group admins can post messages in this announcement-only group' });
      }
    }

    const msgId = crypto.randomUUID();
    await query(
      `INSERT INTO group_messages (id, group_id, user_id, author_name, message) VALUES ($1,$2,$3,$4,$5)`,
      [msgId, groupId, req.user.id, req.user.name || 'Anonymous', message]
    );

    const result = await query(`SELECT * FROM group_messages WHERE id = $1`, [msgId]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Send group message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// 9. Fetch all groups current user is a member of, plus public groups
router.get('/groups', authenticate, async (req, res) => {
  try {
    const result = await query(`
      SELECT g.*, 
             gm.role as my_role,
             COALESCE(u.name, 'System') as creator_name
      FROM discussion_groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.user_id = $1
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.created_by IS NULL OR gm.user_id IS NOT NULL
      ORDER BY g.created_at ASC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch groups error:', err);
    res.status(500).json({ error: 'Failed to retrieve groups' });
  }
});

// 10. Create new discussion group
router.post('/groups', authenticate, async (req, res) => {
  try {
    const { name, features } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    const allowedFeatures = ['all-can-chat', 'admin-only-chat'];
    const finalFeatures = allowedFeatures.includes(features) ? features : 'all-can-chat';

    const groupId = crypto.randomUUID();
    
    // Insert group
    await query(
      `INSERT INTO discussion_groups (id, name, created_by, features) VALUES ($1, $2, $3, $4)`,
      [groupId, name, req.user.id, finalFeatures]
    );

    // Add creator as admin
    await query(
      `INSERT INTO group_members (id, group_id, user_id, role) VALUES ($1, $2, $3, $4)`,
      [crypto.randomUUID(), groupId, req.user.id, 'admin']
    );

    const result = await query(`
      SELECT g.*, 'admin' as my_role, u.name as creator_name
      FROM discussion_groups g
      JOIN users u ON g.created_by = u.id
      WHERE g.id = $1
    `, [groupId]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// 11. Invite user(s) to a group by email
router.post('/groups/:groupId/invite', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    let { emails } = req.body;

    if (!emails) {
      return res.status(400).json({ error: 'No emails provided' });
    }

    // Check if user is admin of group
    const memberCheck = await query(
      `SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, req.user.id]
    );

    if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can invite members' });
    }

    // Normalize emails to array
    if (typeof emails === 'string') {
      emails = emails.split(',').map(e => e.trim());
    }

    const invitedList = [];
    const errorsList = [];

    for (const email of emails) {
      if (!email) continue;
      
      // Check if user exists
      const userCheck = await query(`SELECT id FROM users WHERE email = $1`, [email]);
      if (userCheck.rows.length === 0) {
        errorsList.push(`User with email "${email}" not found`);
        continue;
      }

      const targetUserId = userCheck.rows[0].id;

      // Check if user is already a member
      const existingMember = await query(
        `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
        [groupId, targetUserId]
      );
      if (existingMember.rows.length > 0) {
        errorsList.push(`User "${email}" is already a member of this group`);
        continue;
      }

      // Check if an invite is already pending
      const existingInvite = await query(
        `SELECT 1 FROM group_invitations WHERE group_id = $1 AND email = $2 AND status = 'pending'`,
        [groupId, email]
      );
      if (existingInvite.rows.length > 0) {
        errorsList.push(`Invitation to "${email}" is already pending`);
        continue;
      }

      // Create invitation
      const inviteId = crypto.randomUUID();
      await query(
        `INSERT INTO group_invitations (id, group_id, invited_by, email, status) VALUES ($1, $2, $3, $4, 'pending')`,
        [inviteId, groupId, req.user.id, email]
      );
      invitedList.push(email);
    }

    res.json({ 
      success: true, 
      invited: invitedList, 
      errors: errorsList 
    });
  } catch (err) {
    console.error('Invite members error:', err);
    res.status(500).json({ error: 'Failed to process invitations' });
  }
});

// 12. Get pending invitations for the current user
router.get('/invitations', authenticate, async (req, res) => {
  try {
    const result = await query(`
      SELECT i.*, g.name as group_name, u.name as inviter_name
      FROM group_invitations i
      JOIN discussion_groups g ON i.group_id = g.id
      JOIN users u ON i.invited_by = u.id
      WHERE i.email = $1 AND i.status = 'pending'
      ORDER BY i.created_at DESC
    `, [req.user.email]);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch invitations error:', err);
    res.status(500).json({ error: 'Failed to retrieve invitations' });
  }
});

// 13. Accept group invitation
router.post('/invitations/:inviteId/accept', authenticate, async (req, res) => {
  try {
    const { inviteId } = req.params;
    
    const inviteQuery = await query(
      `SELECT * FROM group_invitations WHERE id = $1 AND email = $2 AND status = 'pending'`,
      [inviteId, req.user.email]
    );

    if (inviteQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Pending invitation not found' });
    }

    const invite = inviteQuery.rows[0];

    // Update invitation
    await query(
      `UPDATE group_invitations SET status = 'accepted' WHERE id = $1`,
      [inviteId]
    );

    // Add to members
    await query(
      `INSERT INTO group_members (id, group_id, user_id, role) 
       VALUES ($1, $2, $3, 'member')
       ON CONFLICT (group_id, user_id) DO UPDATE SET role = 'member'`,
      [crypto.randomUUID(), invite.group_id, req.user.id]
    );

    res.json({ success: true, message: 'Invitation accepted successfully' });
  } catch (err) {
    console.error('Accept invite error:', err);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// 14. Reject group invitation
router.post('/invitations/:inviteId/reject', authenticate, async (req, res) => {
  try {
    const { inviteId } = req.params;

    const result = await query(
      `UPDATE group_invitations SET status = 'rejected' WHERE id = $1 AND email = $2 AND status = 'pending' RETURNING 1`,
      [inviteId, req.user.email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pending invitation not found' });
    }

    res.json({ success: true, message: 'Invitation rejected successfully' });
  } catch (err) {
    console.error('Reject invite error:', err);
    res.status(500).json({ error: 'Failed to reject invitation' });
  }
});

// 15. Get members of a specific group
router.get('/groups/:groupId/members', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Check if group exists
    const groupInfo = await query(`SELECT created_by FROM discussion_groups WHERE id = $1`, [groupId]);
    if (groupInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // If private, verify requester is a member
    if (groupInfo.rows[0].created_by !== null) {
      const memberCheck = await query(
        `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
        [groupId, req.user.id]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Fetch members
    const result = await query(`
      SELECT u.id, u.name, u.email, gm.role, gm.joined_at
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = $1
      ORDER BY gm.joined_at ASC
    `, [groupId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Fetch group members error:', err);
    res.status(500).json({ error: 'Failed to retrieve members list' });
  }
});

// 16. Update a member's role (promote to admin)
router.post('/groups/:groupId/members/:userId/role', authenticate, async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { role } = req.body;

    if (role !== 'admin') {
      return res.status(400).json({ error: 'Only promotion to admin is supported' });
    }

    // Check if current user is admin of group
    const myMemberCheck = await query(
      `SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, req.user.id]
    );

    if (myMemberCheck.rows.length === 0 || myMemberCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can update roles' });
    }

    // Update role
    const result = await query(
      `UPDATE group_members SET role = $1 WHERE group_id = $2 AND user_id = $3 RETURNING 1`,
      [role, groupId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found in this group' });
    }

    res.json({ success: true, message: `Member successfully promoted to ${role}` });
  } catch (err) {
    console.error('Update member role error:', err);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

module.exports = router;
