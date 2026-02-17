const express = require('express');
const User = require('./models/User');
const EmailService = require('./services/emailService');

async function testPasswordResetEmail() {
    try {
        console.log('🧪 Testing Password Reset Email Functionality...\n');
        
        // Create email service
        const emailService = new EmailService();
        
        // Test user data
        const testUser = {
            name: 'Test User',
            email: 'test@example.com',
            role: 'student'
        };
        
        // Test token
        const testToken = 'test-reset-token-123456';
        
        console.log('📧 Sending test password reset email...');
        
        // Send the email
        const result = await emailService.sendPasswordResetEmail(testUser, testToken);
        
        if (result.success) {
            console.log('✅ Email sent successfully!');
            console.log('📨 Message ID:', result.messageId);
            console.log('\n🎉 The HTML template should now display properly in email clients!');
            console.log('\n📋 Email details:');
            console.log(`   - To: ${testUser.email}`);
            console.log(`   - Name: ${testUser.name}`);
            console.log(`   - Reset Token: ${testToken}`);
            console.log(`   - Template: reset-password.hbs (HTML)`);
        } else {
            console.log('❌ Email sending failed:', result.error);
        }
        
    } catch (error) {
        console.error('🚨 Test failed:', error.message);
    }
}

// Run the test
testPasswordResetEmail();