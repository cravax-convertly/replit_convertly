import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertNewsletterSchema } from "@shared/schema";
import Stripe from "stripe";
import multer from "multer";
import { nanoid } from "nanoid";

// Resend email function
async function sendLicenseEmail(email: string, user: any) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured');
  }

  // Generate license key
  const licenseKey = Buffer.from(`${email}:${Date.now()}:premium`).toString('base64');
  
  const emailData = {
    from: 'Cravax Convertly <noreply@cravaxconvertly.com>',
    to: [email],
    subject: '🎉 Welcome to Cravax Convertly Premium!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; text-align: center;">Welcome to Premium!</h1>
        
        <p>Hi ${user.username},</p>
        
        <p>Thank you for upgrading to Cravax Convertly Premium! Your account has been successfully upgraded.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Your Premium Benefits:</h2>
          <ul>
            <li>✅ Unlimited PDF conversions</li>
            <li>✅ No daily limits</li>
            <li>✅ Priority support</li>
            <li>✅ All format conversions (Word, Excel, PowerPoint)</li>
          </ul>
        </div>
        
        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #059669;">Your License Key:</h3>
          <code style="background: white; padding: 5px 10px; border-radius: 4px; display: block; word-break: break-all;">${licenseKey}</code>
          <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">Keep this license key safe for your records.</p>
        </div>
        
        <p>You can start converting files immediately at <a href="https://cravaxconvertly.com/upload.html" style="color: #2563eb;">cravaxconvertly.com</a></p>
        
        <p>If you have any questions, feel free to contact our support team.</p>
        
        <p>Best regards,<br>The Cravax Convertly Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          This email was sent because you purchased a premium subscription to Cravax Convertly.
        </p>
      </div>
    `
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
}

// Welcome email function
async function sendWelcomeEmail(email: string, user: any) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const emailData = {
    from: 'Cravax Convertly <noreply@cravaxconvertly.com>',
    to: [email],
    subject: 'Welcome to Cravax Convertly! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; text-align: center;">Welcome to Cravax Convertly!</h1>
        
        <p>Hi ${user.username || 'there'},</p>
        
        <p>Thank you for joining Cravax Convertly! We're excited to help you convert your PDF files to Word, Excel, and PowerPoint formats.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Your Free Account Includes:</h2>
          <ul>
            <li>✅ 1 PDF conversion per day</li>
            <li>✅ Convert to Word, Excel, or PowerPoint</li>
            <li>✅ Files up to 10MB</li>
            <li>✅ Secure file processing</li>
          </ul>
        </div>
        
        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="margin-top: 0; color: #2563eb;">Ready to start converting?</h3>
          <a href="https://cravaxconvertly.com/upload.html" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
            Start Converting PDFs
          </a>
        </div>
        
        <p>Need unlimited conversions? <a href="https://cravaxconvertly.com" style="color: #2563eb;">Upgrade to Premium</a> for just €3/month and get unlimited conversions with no daily limits.</p>
        
        <p>If you have any questions, just reply to this email - we're here to help!</p>
        
        <p>Best regards,<br>The Cravax Convertly Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          You received this email because you signed up for Cravax Convertly.
        </p>
      </div>
    `
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
}

// Authentication middleware
function extractUserId(req: any): number | null {
  // Try to get user ID from session or token
  // For now, we'll use a simple approach - in production you'd validate JWT tokens
  const userId = req.headers['x-user-id'] || req.query.userId;
  return userId ? parseInt(userId as string) : null;
}

// Require login middleware
function requireLogin(req: any, res: any, next: any) {
  const userId = extractUserId(req);
  if (!userId) {
    return res.status(401).json({ 
      error: "Authentication required", 
      redirectTo: "/login.html" 
    });
  }
  req.userId = userId;
  next();
}

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Initialize Stripe only if API key is provided
  let stripe: Stripe | null = null;
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
    console.log("✅ Stripe initialized successfully");
  } else {
    console.log("⚠️ STRIPE_SECRET_KEY not found - webhook endpoints will be disabled");
  }

  // Middleware to get raw body for Stripe webhook
  app.use('/api/stripe-webhook', (req, res, next) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      req.body = data;
      next();
    });
  });
  
  // Serve static HTML files
  app.get('/upload.html', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'upload.html'));
  });
  
  app.get('/download.html', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'download.html'));
  });
  
  app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'signup.html'));
  });
  
  app.get('/login.html', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'login.html'));
  });
  
  // Serve static JS files
  app.get('/upload.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'upload.js'));
  });
  
  app.get('/auth.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'auth.js'));
  });

  app.get('/simple-auth.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'simple-auth.js'));
  });

  app.get('/simple-login.html', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'simple-login.html'));
  });
  
  app.get('/account.html', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'account.html'));
  });

  // Secure API endpoint for file downloads with authentication  
  app.get('/api/download/:filename', async (req, res) => {
    try {
      const { filename } = req.params;
      const userId = extractUserId(req);
      
      // Require authentication for downloads
      if (!userId) {
        return res.status(401).json({ 
          error: "Authentication required for download",
          redirectTo: "/simple-login.html"
        });
      }
      
      // Check if file exists and belongs to user
      const conversion = await storage.getConversion(filename);
      if (!conversion) {
        return res.status(404).json({ error: "File not found" });
      }
      
      // Check if user owns this file (allow if no user restriction or user matches)
      if (conversion.userId && conversion.userId.toString() !== userId.toString()) {
        return res.status(403).json({ error: "Access denied - file belongs to another user" });
      }
      
      const filePath = path.join(process.cwd(), 'downloads', filename);
      
      // Check if file exists on disk
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found on disk" });
      }
      
      // Set appropriate headers
      res.setHeader('Content-Disposition', `attachment; filename="${conversion.originalName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // Send file
      res.sendFile(filePath);
      
    } catch (error) {
      console.error('Error serving download:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Newsletter subscription endpoint
  app.post("/api/newsletter", async (req, res) => {
    try {
      const validatedData = insertNewsletterSchema.parse(req.body);
      const subscriber = await storage.addNewsletterSubscriber(validatedData);
      res.json({ success: true, message: "Successfully subscribed to newsletter" });
    } catch (error: any) {
      if (error.message === "Email already subscribed") {
        res.status(400).json({ success: false, message: "Email already subscribed" });
      } else {
        res.status(400).json({ success: false, message: "Invalid email address" });
      }
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const dbHealth = await storage.healthCheck();
      res.json({ 
        status: "ok", 
        database: dbHealth,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        status: "error", 
        message: "Database health check failed",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Database statistics endpoint for debugging
  app.get("/api/db-stats", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const newsletters = await storage.getAllNewsletterSubscribers();
      
      res.json({
        users: {
          total: users.length,
          premium: users.filter(u => u.isPremium).length,
          free: users.filter(u => !u.isPremium).length,
        },
        newsletters: {
          total: newsletters.length,
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        status: "error", 
        message: "Failed to fetch database statistics" 
      });
    }
  });

  // Stripe webhook endpoint
  app.post("/api/stripe-webhook", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    console.log("🔔 Stripe webhook received");

    // Validate required environment variables
    if (!stripe) {
      console.error("❌ Stripe not initialized - missing STRIPE_SECRET_KEY environment variable");
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (!webhookSecret) {
      console.error("❌ Missing STRIPE_WEBHOOK_SECRET environment variable");
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (!sig) {
      console.error("❌ Missing Stripe signature in request headers");
      return res.status(400).json({ error: "Missing stripe signature" });
    }

    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      console.log("✅ Stripe webhook signature verified successfully");
    } catch (err: any) {
      console.error("❌ Stripe webhook signature verification failed:", err.message);
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      console.log("🎉 Processing checkout.session.completed event");
      
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_email;

      if (!customerEmail) {
        console.error("❌ No customer email found in checkout session");
        return res.status(400).json({ error: "Customer email not found" });
      }

      console.log(`📧 Customer email: ${customerEmail}`);

      try {
        // Use the setUserPremium method from storage
        const updatedUser = await storage.setUserPremium(customerEmail);
        
        if (updatedUser) {
          console.log(`✅ Successfully upgraded user ${customerEmail} to premium (ID: ${updatedUser.id})`);
          
          // Send license email via Resend (if API key is available)
          if (process.env.RESEND_API_KEY) {
            try {
              await sendLicenseEmail(customerEmail, updatedUser);
              console.log(`📧 License email sent to ${customerEmail}`);
            } catch (emailError: any) {
              console.error(`❌ Failed to send license email: ${emailError.message}`);
              // Don't fail the webhook if email fails
            }
          } else {
            console.log(`⚠️ RESEND_API_KEY not found - license email not sent`);
          }
          
          res.json({ 
            success: true, 
            message: "User upgraded to premium successfully",
            userId: updatedUser.id 
          });
        } else {
          console.error(`❌ User not found for email: ${customerEmail}`);
          res.status(404).json({ error: "User not found for provided email" });
        }
      } catch (error: any) {
        console.error("❌ Error upgrading user to premium:", error.message);
        res.status(500).json({ error: "Failed to upgrade user" });
      }
    } else {
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
      res.json({ received: true });
    }
  });

  // Check if user exists endpoint
  app.get("/api/check-user", async (req, res) => {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      const existingUser = await storage.getUserByEmail(email as string);
      res.json({ 
        exists: !!existingUser,
        email: email
      });
    } catch (error: any) {
      console.error("❌ Error checking user:", error.message);
      res.status(500).json({ error: "Failed to check user" });
    }
  });

  // Signup with welcome email endpoint
  app.post("/api/signup-with-welcome", async (req, res) => {
    const { username, email, password } = req.body;

    console.log(`📧 Creating user with welcome email: ${email}`);

    if (!username || !email || !password) {
      console.error("❌ Missing required fields for user creation");
      return res.status(400).json({ error: "Username, email, and password are required" });
    }

    try {
      const newUser = await storage.createUser({ username, email, password });
      
      console.log(`✅ User created successfully: ${email} (ID: ${newUser.id})`);
      
      // Send welcome email (if Resend is configured)
      if (process.env.RESEND_API_KEY) {
        try {
          await sendWelcomeEmail(email, newUser);
          console.log(`📧 Welcome email sent to ${email}`);
        } catch (emailError: any) {
          console.error(`❌ Failed to send welcome email: ${emailError.message}`);
          // Don't fail the signup if email fails
        }
      } else {
        console.log(`⚠️ RESEND_API_KEY not found - welcome email not sent`);
      }
      
      res.json({ 
        success: true, 
        message: "User created successfully and welcome email sent",
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          isPremium: newUser.isPremium
        }
      });
    } catch (error: any) {
      console.error("❌ Error creating user:", error.message);
      res.status(400).json({ error: error.message });
    }
  });

  // Test user creation endpoint for development
  app.post("/api/test-create-user", async (req, res) => {
    const { username, email, password } = req.body;

    console.log(`🧪 Creating test user: ${email}`);

    if (!username || !email || !password) {
      console.error("❌ Missing required fields for user creation");
      return res.status(400).json({ error: "Username, email, and password are required" });
    }

    try {
      const newUser = await storage.createUser({ username, email, password });
      
      console.log(`✅ Test user created successfully: ${email} (ID: ${newUser.id})`);
      res.json({ 
        success: true, 
        message: "Test user created successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          isPremium: newUser.isPremium
        }
      });
    } catch (error: any) {
      console.error("❌ Error creating test user:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // PDF Conversion endpoint - Allow upload without login, but track user if available
  app.post("/api/convert", upload.single('file'), async (req, res) => {
    try {
      const { format } = req.body;
      const userId = extractUserId(req); // Don't require login for upload
      
      // Validate file
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Validate format
      if (!['word', 'excel', 'powerpoint'].includes(format)) {
        return res.status(400).json({ error: "Invalid format. Must be word, excel, or powerpoint" });
      }
      
      // Check if user can convert (if logged in)
      if (userId) {
        const canConvert = await storage.canUserConvert(userId);
        if (!canConvert.canConvert) {
          // Clean up uploaded file
          fs.unlinkSync(req.file.path);
          return res.status(429).json({ error: canConvert.reason });
        }
      }
      
      // Generate unique filename for converted file
      const fileExtension = format === 'word' ? 'docx' : format === 'excel' ? 'xlsx' : 'pptx';
      const convertedFilename = `${nanoid()}.${fileExtension}`;
      const downloadUrl = `/downloads/${convertedFilename}`;
      
      // Simulate file conversion (in production, you'd use a real conversion library)
      const originalPath = req.file.path;
      const convertedPath = path.join(process.cwd(), 'downloads', convertedFilename);
      
      // For now, just copy the original file with new extension (demo purposes)
      // In production, you'd use a PDF conversion library like pdf-poppler, etc.
      fs.copyFileSync(originalPath, convertedPath);
      
      // Clean up uploaded file
      fs.unlinkSync(originalPath);
      
      // Store conversion record
      const conversion = await storage.addConversion({
        userId: userId || null,
        filename: convertedFilename,
        originalName: req.file.originalname,
        format,
        downloadUrl,
      });
      
      // Update user conversion count if logged in
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          await storage.updateUserConversions(
            userId, 
            user.conversionsToday + 1, 
            new Date()
          );
        }
      }
      
      console.log(`✅ File converted successfully: ${req.file.originalname} -> ${convertedFilename}`);
      
      // Return success with download URL
      res.json({
        success: true,
        message: "File converted successfully",
        filename: convertedFilename,
        download_url: downloadUrl,
        requiresLogin: !userId // Indicate if login is required for download
      });
      
    } catch (error: any) {
      console.error('Conversion error:', error);
      
      // Clean up files on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ 
        error: "Conversion failed", 
        details: error.message 
      });
    }
  });

  // Test upgrade endpoint for manual testing
  app.post("/api/test-upgrade", async (req, res) => {
    const { email } = req.body;

    console.log(`🧪 Testing upgrade for email: ${email}`);

    if (!email) {
      console.error("❌ No email provided for test upgrade");
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      const updatedUser = await storage.setUserPremium(email);
      
      if (updatedUser) {
        console.log(`✅ Test upgrade successful for ${email} (ID: ${updatedUser.id})`);
        res.json({ 
          success: true, 
          message: "Test upgrade successful",
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            username: updatedUser.username,
            isPremium: updatedUser.isPremium
          }
        });
      } else {
        console.error(`❌ User not found for email: ${email}`);
        res.status(404).json({ error: "User not found for provided email" });
      }
    } catch (error: any) {
      console.error("❌ Error during test upgrade:", error.message);
      res.status(500).json({ error: "Failed to upgrade user" });
    }
  });

  // Remove static serving of downloads directory - all downloads go through secure API

  const httpServer = createServer(app);
  return httpServer;
}

// Secure download route
app.get("/api/download/:filename", async (req, res) => {
  const { filename } = req.params;
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const supabase = require("@supabase/supabase-js").createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized: Invalid user" });
    }

    // TODO: Add file ownership check if storing file ownership mapping
    const filePath = path.join(__dirname, "../downloads", filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.download(filePath);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Failed to process download" });
  }
});