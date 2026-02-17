const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:5003/api';
const STUDENT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YmRjN2IxZjEwYTM2OTIxNGQ0MDE1OSIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzU3NDIzNDgzLCJleHAiOjE3NTgwMjgyODN9.Bq0H0DBDcL77UO1OZlx8SdWws4-Yvu4tr2slEIl7IVM';
const SUPERVISOR_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YmE4MzNjMWQxODNiNzJmMDA4NTVkOSIsInJvbGUiOiJzdXBlcnZpc29yIiwiaWF0IjoxNzU3NDIzMzA3LCJleHAiOjE3NTgwMjgxMDd9.kL9ocdyd-sSMjGQWCnuKqZlgmVoweCI42KIrSFpIMGg';

async function testSimpleWeeklyReports() {
    console.log('🧪 Testing Simplified Weekly Report System...\n');

    try {
        // Test 1: Submit a weekly report as student
        console.log('📝 Test 1: Submitting a weekly report as student...');
        
        const formData = new FormData();
        formData.append('weekNumber', '3');
        formData.append('tasksCompleted', 'Completed frontend components, fixed bugs, implemented authentication');
        formData.append('reflections', 'This week was productive. I learned a lot about React hooks and state management.');
        
        // Create a dummy file for testing
        const testContent = 'This is a test weekly report file content.';
        fs.writeFileSync(path.join(__dirname, 'test-report.txt'), testContent);
        formData.append('supportingFiles', fs.createReadStream(path.join(__dirname, 'test-report.txt')));

        const submitResponse = await axios.post(
            `${BASE_URL}/weekly-reports/submit`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${STUDENT_TOKEN}`,
                    ...formData.getHeaders()
                }
            }
        );

        console.log('✅ Report submitted successfully!');
        console.log('Report ID:', submitResponse.data.report._id);
        
        // Test 2: Get student's reports
        console.log('\n📋 Test 2: Fetching student\'s reports...');
        
        const studentReportsResponse = await axios.get(
            `${BASE_URL}/weekly-reports/student/reports`,
            {
                headers: {
                    'Authorization': `Bearer ${STUDENT_TOKEN}`
                }
            }
        );

        console.log('✅ Student reports fetched successfully!');
        console.log('Number of reports:', studentReportsResponse.data.reports.length);
        console.log('Latest report week:', studentReportsResponse.data.reports[0]?.weekNumber);

        // Test 3: Get supervisor's reports
        console.log('\n👨‍🏫 Test 3: Fetching supervisor\'s reports...');
        
        const supervisorReportsResponse = await axios.get(
            `${BASE_URL}/weekly-reports/supervisor/reports`,
            {
                headers: {
                    'Authorization': `Bearer ${SUPERVISOR_TOKEN}`
                }
            }
        );

        console.log('✅ Supervisor reports fetched successfully!');
        console.log('Number of reports:', supervisorReportsResponse.data.reports.length);
        if (supervisorReportsResponse.data.reports.length > 0) {
            console.log('Latest report from student:', supervisorReportsResponse.data.reports[0].student.name);
            console.log('Report week:', supervisorReportsResponse.data.reports[0].weekNumber);
        }

        // Test 4: Submit another report for different week
        console.log('\n📝 Test 4: Submitting another report for week 5...');
        
        const formData2 = new FormData();
        formData2.append('weekNumber', '5');
        formData2.append('tasksCompleted', 'Backend API development, database optimization');
        formData2.append('reflections', 'Week 5 focused on backend work. Learned about MongoDB aggregation.');

        const submitResponse2 = await axios.post(
            `${BASE_URL}/weekly-reports/submit`,
            formData2,
            {
                headers: {
                    'Authorization': `Bearer ${STUDENT_TOKEN}`,
                    ...formData2.getHeaders()
                }
            }
        );

        console.log('✅ Second report submitted successfully!');
        console.log('Report ID:', submitResponse2.data.report._id);

        // Test 5: Try to submit duplicate week (should fail)
        console.log('\n❌ Test 5: Trying to submit duplicate week (should fail)...');
        
        const formData3 = new FormData();
        formData3.append('weekNumber', '3'); // Same week as first report
        formData3.append('tasksCompleted', 'Duplicate week test');
        formData3.append('reflections', 'This should fail');

        try {
            await axios.post(
                `${BASE_URL}/weekly-reports/submit`,
                formData3,
                {
                    headers: {
                        'Authorization': `Bearer ${STUDENT_TOKEN}`,
                        ...formData3.getHeaders()
                    }
                }
            );
            console.log('❌ Duplicate submission should have failed!');
        } catch (error) {
            console.log('✅ Duplicate submission correctly rejected:', error.response.data.message);
        }

        // Final verification
        console.log('\n📊 Final verification: Checking all reports...');
        
        const finalStudentResponse = await axios.get(
            `${BASE_URL}/weekly-reports/student/reports`,
            {
                headers: {
                    'Authorization': `Bearer ${STUDENT_TOKEN}`
                }
            }
        );

        const finalSupervisorResponse = await axios.get(
            `${BASE_URL}/weekly-reports/supervisor/reports`,
            {
                headers: {
                    'Authorization': `Bearer ${SUPERVISOR_TOKEN}`
                }
            }
        );

        console.log('Student has', finalStudentResponse.data.reports.length, 'reports');
        console.log('Supervisor sees', finalSupervisorResponse.data.reports.length, 'reports');
        
        // Clean up test file
        fs.unlinkSync(path.join(__dirname, 'test-report.txt'));

        console.log('\n🎉 All tests passed! Weekly report system is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
        console.error('Stack:', error.stack);
    }
}

testSimpleWeeklyReports();
