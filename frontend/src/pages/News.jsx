import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { 
  Search, Newspaper, TrendingUp, TrendingDown, Info, 
  Calendar, Clock, ExternalLink, Sparkles, Filter, AlertCircle, X, ChevronRight
} from 'lucide-react';

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedHashtag, setSelectedHashtag] = useState(null);

  const categories = ['All', 'Equity', 'Economy', 'F&O', 'Crypto'];

  const hashtags = [
    { label: '#RBI', query: 'RBI' },
    { label: '#Reliance', query: 'Reliance' },
    { label: '#Inflation', query: 'inflation' },
    { label: '#Fed', query: 'Fed' },
    { label: '#Nifty', query: 'Nifty' },
    { label: '#Crypto', query: 'Crypto' },
    { label: '#Earnings', query: 'Profit' }
  ];

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await apiClient.get('/market/news');
        setNews(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column', gap: '16px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(0, 255, 136, 0.1)', borderTop: '4px solid #00ff88', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Gathering market intelligence...</p>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Filter News
  const filteredNews = news.filter(item => {
    // Category Filter
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    
    // Search Query Filter
    const query = searchQuery.toLowerCase();
    const matchesSearch = item.title.toLowerCase().includes(query) || 
                          item.description.toLowerCase().includes(query) || 
                          item.source.toLowerCase().includes(query);

    // Hashtag Filter
    const matchesHashtag = !selectedHashtag || 
                           item.title.toLowerCase().includes(selectedHashtag.toLowerCase()) ||
                           item.description.toLowerCase().includes(selectedHashtag.toLowerCase());

    return matchesCategory && matchesSearch && matchesHashtag;
  });

  const featuredArticle = filteredNews[0];
  const listArticles = filteredNews.slice(1);

  // Sentiment analytics counts
  const sentimentCounts = filteredNews.reduce((acc, curr) => {
    const sent = curr.sentiment || 'Neutral';
    acc[sent] = (acc[sent] || 0) + 1;
    return acc;
  }, { Bullish: 0, Bearish: 0, Neutral: 0 });

  const getSentimentStyle = (sentiment) => {
    switch (sentiment) {
      case 'Bullish':
        return { bg: 'rgba(0, 255, 136, 0.1)', border: 'rgba(0, 255, 136, 0.3)', text: '#00ff88' };
      case 'Bearish':
        return { bg: 'rgba(255, 68, 68, 0.1)', border: 'rgba(255, 68, 68, 0.3)', text: '#ff4444' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.1)', text: 'var(--text-secondary)' };
    }
  };

  const getImpactStyle = (impact) => {
    switch (impact) {
      case 'High':
        return { bg: 'rgba(0, 188, 212, 0.1)', text: '#00bcd4' };
      case 'Medium':
        return { bg: 'rgba(255, 179, 0, 0.1)', text: '#ffb300' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.05)', text: 'var(--text-secondary)' };
    }
  };

  return (
    <div className="news-hub-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.08) 0%, rgba(10, 14, 39, 0.5) 100%)',
        border: '1px solid rgba(0, 255, 136, 0.15)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
            <Newspaper size={32} style={{ color: '#00ff88' }} />
            Market Intelligence Hub
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>
            Institutional-grade news analysis, trade sentiment metrics, and macro policy insights.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ background: 'rgba(0, 255, 136, 0.05)', padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(0, 255, 136, 0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>BULLISH BIAS</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#00ff88' }}>{sentimentCounts.Bullish} Stories</div>
          </div>
          <div style={{ background: 'rgba(255, 68, 68, 0.05)', padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(255, 68, 68, 0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>BEARISH BIAS</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#ff4444' }}>{sentimentCounts.Bearish} Stories</div>
          </div>
        </div>
      </div>

      {/* Categories & Search Panel */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSelectedHashtag(null); // Clear hashtag when switching categories
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '20px',
                border: activeCategory === cat ? '1px solid #00ff88' : '1px solid var(--border-color)',
                background: activeCategory === cat ? 'rgba(0, 255, 136, 0.1)' : 'var(--bg-glass-light)',
                color: activeCategory === cat ? '#00ff88' : 'var(--text-primary)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeCategory === cat ? '0 0 12px rgba(0, 255, 136, 0.15)' : 'none'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Reset */}
        <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '400px', position: 'relative' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search headlines, tickers, sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                background: 'var(--bg-glass-light)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '14px',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#00ff88'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>
          {(searchQuery || selectedHashtag) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedHashtag(null);
              }}
              style={{
                padding: '8px 14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        
        {/* Left Column: News Articles Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {filteredNews.length === 0 ? (
            <div style={{
              background: 'var(--bg-card-glass)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '60px 24px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <AlertCircle size={48} style={{ color: 'var(--text-secondary)' }} />
              <h3>No Articles Found</h3>
              <p style={{ fontSize: '14px' }}>Try adjusting your search criteria or switching categories.</p>
            </div>
          ) : (
            <>
              {/* Highlight Featured Article */}
              {featuredArticle && !selectedHashtag && searchQuery === '' && (
                <div 
                  onClick={() => setSelectedArticle(featuredArticle)}
                  style={{
                    background: 'var(--bg-card-glass)',
                    border: '1px solid rgba(0, 255, 136, 0.2)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(250px, 4fr) 5fr',
                    maxHeight: '400px'
                  }}
                  className="featured-news-card"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#00ff88';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 255, 136, 0.2)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ overflow: 'hidden', height: '100%', position: 'relative' }}>
                    <img 
                      src={featuredArticle.image} 
                      alt="" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} 
                    />
                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', color: '#00ff88', border: '1px solid #00ff88' }}>
                      FEATURED STORY
                    </div>
                  </div>
                  <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#00ff88', letterSpacing: '0.5px' }}>{featuredArticle.category}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>•</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{featuredArticle.source}</span>
                    </div>

                    <h2 style={{ fontSize: '20px', fontWeight: '800', lineHeight: '1.4', color: 'var(--text-primary)' }}>{featuredArticle.title}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {featuredArticle.description}
                    </p>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px', alignItems: 'center' }}>
                      {/* Sentiment Tag */}
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: getSentimentStyle(featuredArticle.sentiment).bg,
                        border: `1px solid ${getSentimentStyle(featuredArticle.sentiment).border}`,
                        color: getSentimentStyle(featuredArticle.sentiment).text
                      }}>
                        {featuredArticle.sentiment}
                      </span>
                      {/* Impact Tag */}
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: getImpactStyle(featuredArticle.impact).bg,
                        color: getImpactStyle(featuredArticle.impact).text
                      }}>
                        {featuredArticle.impact} Impact
                      </span>
                      
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <Clock size={12} />
                        <span>{featuredArticle.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Feed Card Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '20px' }}>
                {(selectedHashtag || searchQuery !== '' ? filteredNews : listArticles).map((item, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedArticle(item)}
                    style={{
                      background: 'var(--bg-card-glass)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease',
                      height: '380px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 255, 136, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{ height: '160px', overflow: 'hidden' }}>
                      <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#00ff88', textTransform: 'uppercase' }}>{item.category}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.source}</span>
                      </div>
                      
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        lineHeight: '1.4',
                        color: 'var(--text-primary)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>{item.title}</h3>
                      
                      <p style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>{item.description}</p>

                      <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', alignItems: 'center' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: '700',
                          background: getSentimentStyle(item.sentiment).bg,
                          color: getSentimentStyle(item.sentiment).text
                        }}>{item.sentiment}</span>
                        
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: '700',
                          background: getImpactStyle(item.impact).bg,
                          color: getImpactStyle(item.impact).text
                        }}>{item.impact}</span>

                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          <Clock size={10} />
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Column: Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Trending Panel */}
          <div style={{
            background: 'var(--bg-card-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sparkles size={18} style={{ color: '#ffb300' }} />
              Trending Topics
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {hashtags.map((tag) => (
                <button
                  key={tag.label}
                  onClick={() => {
                    if (selectedHashtag === tag.query) {
                      setSelectedHashtag(null); // Deselect if clicked again
                    } else {
                      setSelectedHashtag(tag.query);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: selectedHashtag === tag.query ? '1px solid #00ff88' : '1px solid transparent',
                    background: selectedHashtag === tag.query ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    color: selectedHashtag === tag.query ? '#00ff88' : 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedHashtag !== tag.query) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedHashtag !== tag.query) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  }}
                >
                  <span>{tag.label}</span>
                  <ChevronRight size={14} style={{ opacity: 0.6 }} />
                </button>
              ))}
            </div>
          </div>

          {/* Market Sentiment Stats */}
          <div style={{
            background: 'var(--bg-card-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Sentiment Composition
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: '#00ff88', fontWeight: '600' }}>Bullish Bias</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{sentimentCounts.Bullish} articles</span>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    background: '#00ff88', 
                    height: '100%', 
                    width: `${filteredNews.length > 0 ? (sentimentCounts.Bullish / filteredNews.length) * 100 : 0}%`,
                    boxShadow: '0 0 8px #00ff88'
                  }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: '#ff4444', fontWeight: '600' }}>Bearish Bias</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{sentimentCounts.Bearish} articles</span>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    background: '#ff4444', 
                    height: '100%', 
                    width: `${filteredNews.length > 0 ? (sentimentCounts.Bearish / filteredNews.length) * 100 : 0}%`,
                    boxShadow: '0 0 8px #ff4444'
                  }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Neutral/Balanced</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{sentimentCounts.Neutral} articles</span>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    background: 'var(--text-secondary)', 
                    height: '100%', 
                    width: `${filteredNews.length > 0 ? (sentimentCounts.Neutral / filteredNews.length) * 100 : 0}%` 
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Glassmorphic Article Reading Modal */}
      {selectedArticle && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 14, 39, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card-glass)',
            border: '1px solid rgba(0, 255, 136, 0.25)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 255, 136, 0.1)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(255, 255, 255, 0.01)'
            }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#00ff88', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Newspaper size={12} />
                Market Intelligence Report
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content Scrollable Area */}
            <div style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Media Image */}
              <div style={{ width: '100%', height: '240px', borderRadius: '10px', overflow: 'hidden' }}>
                <img src={selectedArticle.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {/* metadata */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>{selectedArticle.source}</span>
                <span style={{ color: 'var(--text-secondary)' }}>•</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedArticle.date}</span>
                <span style={{ color: 'var(--text-secondary)' }}>•</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  {selectedArticle.time}
                </span>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '700',
                    background: getSentimentStyle(selectedArticle.sentiment).bg,
                    color: getSentimentStyle(selectedArticle.sentiment).text
                  }}>{selectedArticle.sentiment}</span>
                  
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '700',
                    background: getImpactStyle(selectedArticle.impact).bg,
                    color: getImpactStyle(selectedArticle.impact).text
                  }}>{selectedArticle.impact} Impact</span>
                </div>
              </div>

              {/* Title & Desc */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', lineHeight: '1.3', color: 'var(--text-primary)' }}>{selectedArticle.title}</h2>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>{selectedArticle.description}</p>
              </div>

              {/* NonStock Market Takeaway analysis card */}
              <div style={{
                background: 'rgba(255, 179, 0, 0.05)',
                border: '1px solid rgba(255, 179, 0, 0.25)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <Sparkles size={20} style={{ color: '#ffb300', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#ffb300', marginBottom: '4px' }}>NonStock Intelligence Takeaway</h4>
                  <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-primary)' }}>{selectedArticle.takeaway}</p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
              background: 'rgba(255, 255, 255, 0.01)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setSelectedArticle(null)}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Close Report
              </button>
              
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '10px 20px',
                  background: '#00ff88',
                  color: '#000000',
                  fontWeight: '700',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  boxShadow: '0 0 12px rgba(0, 255, 136, 0.2)'
                }}
              >
                Read Full Source
                <ExternalLink size={14} />
              </a>
            </div>

          </div>
        </div>
      )}
      
      {/* Modal Keyframe animation */}
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

    </div>
  );
}