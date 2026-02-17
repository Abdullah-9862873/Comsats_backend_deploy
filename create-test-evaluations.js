const mongoose = require('mongoose');
const InterneeEvaluation = require('./models/InterneeEvaluation');
const Application = require('./models/Application');
const User = require('./models/User');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/internship_portal';

async function createTestEvaluations() {
    try {
        await mongoose.connect(mongoURI);
        console.log('🔗 Connected to MongoDB');

        // Find Company_1
        const company = await User.findOne({ username: 'Company_1', role: 'company' });
        console.log('\n📊 Company_1 ID:', company._id);

        // Find Supervisor_1
        const supervisor = await User.findOne({ username: 'Supervisor_1', role: 'supervisor' });
        console.log('📊 Supervisor_1 ID:', supervisor._id);

        // Get all hired applications for Company_1
        const applications = await Application.find({ 
            companyId: company._id, 
            overallStatus: 'approved' 
        });
        
        console.log(`\n📋 Found ${applications.length} hired applications`);

        // Create evaluations for each hired student
        for (let i = 0; i < applications.length; i++) {
            const app = applications[i];
            const evaluation = new InterneeEvaluation({
                internId: app.studentId,
                companyId: company._id,
                applicationId: app._id,
                evaluation: {
                    punctualityAndAttendance: 4,
                    abilityToLinkTheoryToPractice: 3,
                    demonstratedCriticalThinking: 3,
                    technicalKnowledge: 4,
                    creativityConceptualAbility: 3,
                    abilityToAdaptToVarietyOfTasks: 4,
                    timeManagementDeadlineCompliance: 4,
                    behavedInProfessionalManner: 4,
                    effectivelyPerformedAssignments: 4,
                    oralWrittenCommunicationSkills: 3,
                    totalMarks: 36,
                    maxMarks: 40,
                    supervisorComments: `Excellent performance by ${app.studentName}. Shows great potential and dedication.`
                }
            });

            await evaluation.save();
            console.log(`✅ Created evaluation for ${app.studentName} (ID: ${app.studentId})`);
        }

        await mongoose.disconnect();
        console.log('\n🔚 Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
    }
}

createTestEvaluations();
