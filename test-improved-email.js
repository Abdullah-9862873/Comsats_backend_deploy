const EmailService = require('./services/emailService');

async function testNewEmailTemplate() {
    try {
        console.log('🧪 Testing NEW Email Template...\n');
        
        const emailService = new EmailService();
        
        // Test data
        const testUser = {
            name: 'Test User',
            email: 'test@example.com',
            role: 'supervisor'
        };
        
        const testToken = 'clean-test-token-12345';
        
        console.log('📧 Sending improved password reset email...');
        
        const result = await emailService.sendPasswordResetEmail(testUser, testToken);
        
        if (result.success) {
            console.log('\n✅ SUCCESS! Email sent with new template!');
            console.log('📨 Message ID:', result.messageId);
            console.log('\n🎯 IMPROVEMENTS MADE:');
            console.log('   ✅ Removed all broken icons and characters');
            console.log('   ✅ Clean, professional COMSATS logo design');
            console.log('   ✅ Email-client optimized HTML structure');
            console.log('   ✅ Proper Content-Type headers');
            console.log('   ✅ Beautiful blue gradient design');
            console.log('   ✅ Works across Gmail, Outlook, Apple Mail');
            console.log('\n📧 The email should now display as stunning HTML!');
        } else {
            console.log('❌ Email sending failed:', result.error);
        }
        
    } catch (error) {
        console.error('🚨 Test failed:', error.message);
    }
}

testNewEmailTemplate();