// Export service for PDF and Excel generation
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Generate Portfolio PDF Report
const generatePortfolioPDF = async (portfolio, fileName = 'portfolio.pdf') => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const filePath = path.join(__dirname, `../../${fileName}`);
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);
      
      // Header
      doc.fontSize(24).text('Portfolio Report', 100, 50);
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, 100, 100);
      
      // Summary
      doc.fontSize(14).text('Summary', 100, 150);
      doc.fontSize(10);
      doc.text(`Total Value: ₹${portfolio.totalValue || 0}`, 100, 180);
      doc.text(`Total Invested: ₹${portfolio.totalInvested || 0}`, 100, 200);
      doc.text(`Total Returns: ₹${portfolio.totalReturns || 0}`, 100, 220);
      
      // Holdings table
      let yPos = 280;
      doc.fontSize(12).text('Holdings', 100, yPos);
      yPos += 30;
      
      doc.fontSize(9);
      portfolio.holdings?.forEach((holding) => {
        doc.text(`${holding.symbol} - ${holding.quantity} units @ ₹${holding.price}`, 100, yPos);
        yPos += 20;
      });
      
      doc.end();
      
      stream.on('finish', () => resolve(filePath));
    } catch (err) {
      reject(err);
    }
  });
};

// Generate Portfolio Excel Report
const generatePortfolioExcel = async (portfolio, fileName = 'portfolio.xlsx') => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Portfolio');
    
    // Headers
    worksheet.columns = [
      { header: 'Symbol', key: 'symbol', width: 15 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Entry Price', key: 'price', width: 15 },
      { header: 'Current Price', key: 'currentPrice', width: 15 },
      { header: 'Value', key: 'value', width: 15 },
      { header: 'Gain/Loss', key: 'gainLoss', width: 15 },
      { header: 'Return %', key: 'returnPercent', width: 15 }
    ];
    
    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
    
    // Add rows
    portfolio.holdings?.forEach((holding) => {
      const value = holding.quantity * holding.currentPrice;
      const invested = holding.quantity * holding.price;
      const gainLoss = value - invested;
      const returnPercent = (gainLoss / invested) * 100;
      
      worksheet.addRow({
        symbol: holding.symbol,
        quantity: holding.quantity,
        price: holding.price,
        currentPrice: holding.currentPrice,
        value: value.toFixed(2),
        gainLoss: gainLoss.toFixed(2),
        returnPercent: returnPercent.toFixed(2)
      });
    });
    
    // Summary section
    const rowCount = (portfolio.holdings?.length || 0) + 3;
    worksheet.addRow({});
    worksheet.addRow({ symbol: 'TOTAL', value: portfolio.totalValue?.toFixed(2) });
    worksheet.addRow({ symbol: 'Total Invested', value: portfolio.totalInvested?.toFixed(2) });
    worksheet.addRow({ symbol: 'Total Returns', value: portfolio.totalReturns?.toFixed(2) });
    
    const filePath = path.join(__dirname, `../../${fileName}`);
    await workbook.xlsx.writeFile(filePath);
    
    return filePath;
  } catch (err) {
    throw new Error(`Excel generation failed: ${err.message}`);
  }
};

module.exports = {
  generatePortfolioPDF,
  generatePortfolioExcel
};
