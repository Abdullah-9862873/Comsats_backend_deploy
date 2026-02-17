const fs = require('fs');
const path = require('path');

// Simple template validation
try {
    const templatePath = path.join(__dirname, 'templates/emails/reset-password.hbs');
    const template = fs.readFileSync(templatePath, 'utf8');
    
    console.log('📧 Template validation results:');
    console.log('✅ File exists and readable');
    console.log(`📄 Template size: ${template.length} characters`);
    
    // Check for basic HTML structure
    const hasDoctype = template.includes('<!DOCTYPE html>');
    const hasOpeningHtml = template.includes('<html');
    const hasClosingHtml = template.includes('</html>');
    const hasOpeningBody = template.includes('<body>');
    const hasClosingBody = template.includes('</body>');
    const hasStyleTag = template.includes('<style>') && template.includes('</style>');
    
    console.log('\n🔍 HTML Structure Check:');
    console.log(`DOCTYPE: ${hasDoctype ? '✅' : '❌'}`);
    console.log(`HTML tags: ${hasOpeningHtml && hasClosingHtml ? '✅' : '❌'}`);
    console.log(`BODY tags: ${hasOpeningBody && hasClosingBody ? '✅' : '❌'}`);
    console.log(`STYLE tags: ${hasStyleTag ? '✅' : '❌'}`);
    
    // Check for handlebars variables
    const handlebarsVars = template.match(/\{\{[^}]+\}\}/g) || [];
    console.log(`\n📝 Handlebars variables found: ${handlebarsVars.length}`);
    handlebarsVars.forEach(var_ => console.log(`   - ${var_}`));
    
    // Check for potential issues
    const hasInvalidStyleContent = template.includes('<style>') && 
        template.substring(template.indexOf('<style>'), template.indexOf('</style>')).includes('<div');
    
    console.log('\n⚠️  Potential Issues:');
    console.log(`HTML in style tag: ${hasInvalidStyleContent ? '❌ FOUND!' : '✅ Clean'}`);
    
    if (hasInvalidStyleContent) {
        console.log('🚨 WARNING: HTML content found inside <style> tags - this will break email rendering!');
    } else {
        console.log('🎉 Template appears to be valid!');
    }
    
} catch (error) {
    console.error('❌ Template validation failed:', error.message);
}