const sgMail = require('@sendgrid/mail');

module.exports = async ({ req, res, log, error }) => {
  try {
    const order = (req.body.data || req.body);
    
    // Validate order data
    if (!order.$id) {
      return res.json({ error: 'Invalid order data' }, 400);
    }
    
    // ALWAYS use your verified domain sender, not personal email
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Best practice email configuration
    const msg = {
      to: 'abdeallahdz2004@gmail.com',
      from: {
        email: 'abdellah.becherair@gmail.com', // ✅ USE YOUR VERIFIED DOMAIN
        name: 'Your Store Name'
      },
      replyTo: 'support@iamrise.net', // Important for replies
      subject: `Order Confirmation #${order.$id}`,
      
      // Plain text version (MUST HAVE for spam prevention)
      text: `
        New Order Notification
        
        Order ID: ${order.$id}
        Customer: ${order.fullname}
        Phone: ${order.phone}
        Total: $${parseFloat(order.total_price).toFixed(2)}
        
        Thank you for your order!
        
        ${order.address ? `Delivery Address: ${order.address}` : ''}
        
        ---
        This is an automated message from Your Store.
        Contact us: support@iamrise.net
      `,
      
      // HTML version
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <!-- Logo/Header -->
          <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h1 style="color: #2c3e50; margin: 0;">Your Store Name</h1>
            <p style="color: #7f8c8d; margin: 5px 0 0 0;">Order Confirmation</p>
          </div>
          
          <!-- Main Content -->
          <div style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 25px;">
            <h2 style="color: #27ae60; margin-top: 0;">Thank you for your order!</h2>
            
            <p>Hello,</p>
            <p>We've received your order and will process it shortly.</p>
            
            <!-- Order Details Box -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2c3e50;">Order Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Order ID:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${order.$id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Customer:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${order.fullname}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Phone:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${order.phone}</td>
                </tr>
                ${order.address ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Address:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${order.address}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Total Amount:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                    <strong style="color: #27ae60; font-size: 1.1em;">$${parseFloat(order.total_price).toFixed(2)}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Status:</strong></td>
                  <td style="padding: 8px 0;">
                    <span style="background: #3498db; color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.9em;">
                      ${order.order_status || 'Processing'}
                    </span>
                  </td>
                </tr>
              </table>
            </div>
            
            <p>We'll notify you when your order ships.</p>
            
            <!-- Contact Info -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="margin-bottom: 5px;">
                <strong>Need help?</strong><br>
                Contact our support team at 
                <a href="mailto:support@iamrise.net" style="color: #3498db; text-decoration: none;">
                  support@iamrise.net
                </a>
              </p>
              <p style="font-size: 0.9em; color: #7f8c8d; margin: 0;">
                This is an automated message. Please do not reply directly to this email.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #7f8c8d; font-size: 0.9em;">
            <p>
              &copy; ${new Date().getFullYear()} Your Store Name. All rights reserved.<br>
              Your Business Address, City, Country
            </p>
            <p>
              <a href="https://iamrise.net" style="color: #7f8c8d; text-decoration: none;">Website</a> | 
              <a href="https://iamrise.net/privacy" style="color: #7f8c8d; text-decoration: none;">Privacy Policy</a> | 
              <a href="https://iamrise.net/unsubscribe" style="color: #7f8c8d; text-decoration: none;">Unsubscribe</a>
            </p>
          </div>
          
        </body>
        </html>
      `,
      
      // IMPORTANT: Add these headers to avoid spam
      headers: {
        'X-Entity-Ref-ID': order.$id, // Unique tracking ID
        'List-Unsubscribe': '<mailto:unsubscribe@iamrise.net>', // Unsubscribe option
      },
      
      // SendGrid categories for analytics
      categories: ['order-confirmation', 'transactional'],
      
      // Send at a specific time (optional)
      // sendAt: Math.floor(Date.now() / 1000) + 60, // 1 minute from now
      
      // Click tracking (optional)
      trackingSettings: {
        clickTracking: {
          enable: false // Keep false to avoid looking spammy
        },
        openTracking: {
          enable: false // Keep false to avoid looking spammy
        }
      },
      
      // Mail settings (important!)
      mailSettings: {
        sandboxMode: {
          enable: false // MUST be false for production
        },
        spamCheck: {
          enable: true,
          threshold: 5, // 1-10, lower is stricter
          postToUrl: 'https://mwsool.com/spam-reports'
        }
      }
    };
    
    // Send email
    await sgMail.send(msg);
    log(`✅ Email sent for order ${order.$id}`);
    
    return res.json({
      success: true,
      message: 'Order confirmation email sent successfully',
      orderId: order.$id
    });
    
  } catch (err) {
    error('SendGrid Error: ' + JSON.stringify(err.response?.body || err.message, null, 2));
    return res.json({
      success: false,
      error: err.message,
      details: err.response?.body
    }, 500);
  }
};