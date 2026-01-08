const sgMail = require('@sendgrid/mail');

module.exports = async ({ req, res, log, error }) => {
  try {
    // Parse the request payload
    const order = JSON.parse(req.body || req.payload || '{}');
    
    // Use log for logging (optional)
    log('Processing order email for order: ' + order.$id);

    // Set SendGrid API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: 'abdeallahdz2004@gmail.com',
      from: 'abdellah.becherair@gmail.com',
      subject: `New Order #${order.$id}`,
      html: `
        <h2>New Order Details</h2>
        <p><strong>Customer:</strong> ${order.fullname}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Total:</strong> ${order.total_price}</p>
      `
    };

    await sgMail.send(msg);
    
    // Use Appwrite's res.json() or res.send()
    return res.json({
      success: true,
      message: 'Order email sent successfully!'
    });
    
  } catch (err) {
    // Use error() for error logging
    error('Failed to send email: ' + err.message);
    
    // Return error response
    return res.json({
      success: false,
      error: err.message
    }, 500); // Optional status code
  }
};