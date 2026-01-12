const sgMail = require('@sendgrid/mail');

module.exports = async ({ req, res, log, error }) => {
  try {
    // Log full request for debugging
    log('=== CONTACT FORM TRIGGERED ===', req.body.data);
    log('Request body: ' + JSON.stringify(req.body, null, 2));
    log('Request body: ' + JSON.stringify(req.body.$collectionId, null, 2));

    if (req.body.$collectionId !== 'contact_messages') {
      return res.json({ error: "Collection ID does not match contact_messages" }, 400);
    }
    // Extract contact data from Appwrite database event
    let contactData;

    if (req.body && req.body.data) {
      // Database event format
      contactData = req.body.data;
      log('Data from database event: ' + JSON.stringify(contactData, null, 2));
    } else {
      // Direct call format
      contactData = req.body;
      log('Data from direct call: ' + JSON.stringify(contactData, null, 2));
    }

    // Validate required fields
    const required = ['name', 'email', 'message'];
    const missing = required.filter(field => !contactData[field]);

    if (missing.length > 0) {
      error(`Missing required fields: ${missing.join(', ')}`);
      return res.json({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`
      }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactData.email)) {
      error(`Invalid email: ${contactData.email}`);
      return res.json({
        success: false,
        error: 'Invalid email address format'
      }, 400);
    }

    // Initialize SendGrid
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is not set');
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    log('SendGrid initialized');

    // 1. Send confirmation email to user
    const userEmail = {
      to: contactData.email,
      from: {
        email: process.env.CONTACT_FROM_EMAIL || 'abdellah.becherair@gmail.com',
        name: process.env.CONTACT_FROM_NAME || 'iamrise'
      },
      replyTo: process.env.CONTACT_REPLY_TO || 'abdellah.becherair@gmail.com',
      subject: `Thank you for contacting ${process.env.CONTACT_FROM_NAME || 'us'}!`,
      text: `
Hi ${contactData.name },

Thank you for reaching out to us! We've received your message and will respond within 24-48 hours.

Your message:
${contactData.message}

Best regards,
${process.env.CONTACT_FROM_NAME || 'iamrise'}
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Contacting Us</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin: 0;">${process.env.CONTACT_FROM_NAME || 'iamrise'}</h1>
    <p style="color: #7f8c8d; margin: 5px 0 0 0;">Contact Confirmation</p>
  </div>
  
  <div style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 25px;">
    <h2 style="color: #27ae60; margin-top: 0;">Thank You, ${contactData.name}!</h2>
    <p>We've received your message and will get back to you within 24-48 hours.</p>
    
    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3498db;">
      <p style="white-space: pre-line; margin: 0;">${contactData.message}</p>
    </div>
    
    <p><strong>Contact Details:</strong></p>
    <ul style="padding-left: 20px;">
      <li><strong>Name:</strong> ${contactData.name}</li>
      <li><strong>Email:</strong> ${contactData.email}</li>
      ${contactData.phone ? `<li><strong>Phone:</strong> ${contactData.phone}</li>` : ''}
      ${contactData.subject ? `<li><strong>Subject:</strong> ${contactData.subject}</li>` : ''}
    </ul>
    
    <p>Best regards,<br>
    <strong>${process.env.CONTACT_FROM_NAME || 'iamrise'}</strong></p>
  </div>
</body>
</html>
      `
    };

    // 2. Send notification to admin
    const adminEmail = {
      to: process.env.CONTACT_ADMIN_EMAIL || 'abdeallahdz2004@gmail.com',
      from: {
        email: process.env.CONTACT_FROM_EMAIL || 'abdellah.becherair@gmail.com',
        name: 'Website Contact Form'
      },
      replyTo: contactData.email,
      subject: `📧 New Contact: ${contactData.name}`,
      text: `
New Contact Form Submission

From: ${contactData.name}
Email: ${contactData.email}
${contactData.phone ? `Phone: ${contactData.phone}` : ''}
${contactData.subject ? `Subject: ${contactData.subject}` : ''}
Time: ${new Date().toLocaleString()}

Message:
${contactData.message}
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <h2 style="color: #856404; margin-top: 0;">New Contact Form Submission</h2>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 6px;">
      <h3>Contact Details</h3>
      <p><strong>Name:</strong> ${contactData.name}</p>
      <p><strong>Email:</strong> <a href="mailto:${contactData.email}">${contactData.email}</a></p>
      ${contactData.phone ? `<p><strong>Phone:</strong> <a href="tel:${contactData.phone}">${contactData.phone}</a></p>` : ''}
      ${contactData.subject ? `<p><strong>Subject:</strong> ${contactData.subject}</p>` : ''}
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <div style="margin: 20px 0; padding: 15px; background: white; border: 1px solid #dee2e6; border-radius: 6px;">
      <h3>Message</h3>
      <div style="white-space: pre-line; background: #f8f9fa; padding: 15px; border-radius: 4px;">
        ${contactData.message}
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="mailto:${contactData.email}" 
         style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
        Reply to ${contactData.name}
      </a>
    </div>
  </div>
</body>
</html>
      `
    };

    // Send both emails
    const [userResult, adminResult] = await Promise.all([
      sgMail.send(userEmail),
      sgMail.send(adminEmail)
    ]);

    log(`✅ Confirmation sent to: ${contactData.email}`);
    log(`✅ Notification sent to admin`);

    return res.json({
      success: true,
      message: 'Contact emails sent successfully',
      contactId: contactData.$id,
      emails: {
        user: 'sent',
        admin: 'sent'
      }
    });

  } catch (err) {
    error('❌ Contact function error: ' + err.message);
    error('Error details: ' + JSON.stringify(err.response?.body || err, null, 2));

    return res.json({
      success: false,
      error: 'Failed to process contact form'
    }, 500);
  }
};