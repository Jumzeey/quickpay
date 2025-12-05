import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateReceiptPDF = async (elementId: string, filename: string = 'receipt.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Receipt element not found');
  }

  try {
    // Temporarily make element visible for capture (but keep it off-screen)
    const originalStyle = {
      position: element.style.position,
      left: element.style.left,
      top: element.style.top,
      visibility: element.style.visibility,
      opacity: element.style.opacity,
    };

    // Ensure element is visible for html2canvas
    element.style.position = 'fixed';
    element.style.left = '0';
    element.style.top = '0';
    element.style.visibility = 'visible';
    element.style.opacity = '1';
    element.style.zIndex = '9999';

    // Wait a bit for styles to apply
    await new Promise(resolve => setTimeout(resolve, 100));

    // Convert all images to base64 to ensure they're loaded
    const images = element.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map((img: HTMLImageElement) => {
        return new Promise((resolve) => {
          if (img.complete && img.naturalHeight !== 0) {
            resolve(null);
            return;
          }
          
          img.onload = () => resolve(null);
          img.onerror = () => resolve(null); // Continue even if image fails
          
          // Force reload if needed
          if (img.src && !img.complete) {
            const newImg = new window.Image();
            newImg.crossOrigin = 'anonymous';
            newImg.src = img.src;
            newImg.onload = () => {
              img.src = newImg.src;
              resolve(null);
            };
            newImg.onerror = () => resolve(null);
          } else {
            resolve(null);
          }
        });
      })
    );

    // Wait a bit more for everything to render
    await new Promise(resolve => setTimeout(resolve, 200));

    // Create canvas from the receipt element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: false,
      imageTimeout: 5000,
    });

    // Restore original styles
    element.style.position = originalStyle.position || '';
    element.style.left = originalStyle.left || '';
    element.style.top = originalStyle.top || '';
    element.style.visibility = originalStyle.visibility || '';
    element.style.opacity = originalStyle.opacity || '';
    element.style.zIndex = '';

    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Calculate PDF dimensions (A4 size in mm)
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    });

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

