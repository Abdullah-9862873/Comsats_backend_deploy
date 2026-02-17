const User = require('../models/User');
const Application = require('../models/Application');
const SupervisionRequest = require('../models/SupervisionRequest');

/**
 * Sync supervisor student counts based on accepted supervision requests
 * This function ensures currentStudents count matches actual assigned students
 */
const syncSupervisorStudentCounts = async () => {
  try {
    console.log('🔄 Starting supervisor student count synchronization...');
    
    // Get all supervisors
    const supervisors = await User.find({ role: 'supervisor' });
    
    for (const supervisor of supervisors) {
      // Count accepted supervision requests for this supervisor
      const acceptedRequests = await SupervisionRequest.find({
        supervisorId: supervisor._id,
        status: 'accepted'
      });
      
      const actualStudentCount = acceptedRequests.length;
      const currentCount = supervisor.supervisor?.currentStudents || 0;
      
      // Get unique student IDs from accepted requests
      const assignedStudentIds = [...new Set(acceptedRequests.map(req => req.studentId))];
      
      if (actualStudentCount !== currentCount) {
        console.log(`📊 Supervisor ${supervisor.name}: Syncing count from ${currentCount} to ${actualStudentCount}`);
        
        // Update supervisor's student count and assigned students
        await User.findByIdAndUpdate(supervisor._id, {
          'supervisor.currentStudents': actualStudentCount,
          'supervisor.assignedStudents': assignedStudentIds
        });
      }
    }
    
    console.log('✅ Supervisor student count synchronization completed');
    return { success: true, message: 'Student counts synchronized successfully' };
    
  } catch (error) {
    console.error('❌ Error synchronizing supervisor student counts:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if supervisor has reached their student limit based on accepted requests
 */
const isSupervisorAtCapacity = async (supervisorId) => {
  try {
    const supervisor = await User.findById(supervisorId);
    
    if (!supervisor || supervisor.role !== 'supervisor') {
      return { atCapacity: false, error: 'Supervisor not found' };
    }
    
    const maxStudents = supervisor.supervisor?.maxStudents || 10;
    
    // Count accepted supervision requests for real-time capacity check
    const acceptedRequestsCount = await SupervisionRequest.countDocuments({
      supervisorId: supervisorId,
      status: 'accepted'
    });
    
    const currentStudents = acceptedRequestsCount;
    
    return {
      atCapacity: currentStudents >= maxStudents,
      currentStudents,
      maxStudents,
      availableSlots: maxStudents - currentStudents
    };
  } catch (error) {
    console.error('Error checking supervisor capacity:', error);
    return { atCapacity: false, error: error.message };
  }
};

/**
 * Get supervisor availability status based on accepted supervision requests
 */
const getSupervisorAvailability = async (supervisorId) => {
  try {
    const supervisor = await User.findById(supervisorId);
    
    if (!supervisor || supervisor.role !== 'supervisor') {
      return { available: false, error: 'Supervisor not found' };
    }
    
    const maxStudents = supervisor.supervisor?.maxStudents || 10;
    
    // Count accepted supervision requests for real-time availability
    const acceptedRequestsCount = await SupervisionRequest.countDocuments({
      supervisorId: supervisorId,
      status: 'accepted'
    });
    
    const currentStudents = acceptedRequestsCount;
    const available = currentStudents < maxStudents;
    
    return {
      available,
      currentStudents,
      maxStudents,
      availableSlots: maxStudents - currentStudents,
      utilizationPercentage: Math.round((currentStudents / maxStudents) * 100)
    };
  } catch (error) {
    console.error('Error getting supervisor availability:', error);
    return { available: false, error: error.message };
  }
};

module.exports = {
  syncSupervisorStudentCounts,
  isSupervisorAtCapacity,
  getSupervisorAvailability
};