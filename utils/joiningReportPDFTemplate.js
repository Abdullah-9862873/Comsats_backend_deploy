import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontFamily: 'Times-Roman',
    fontSize: 11,
    lineHeight: 1.5,
  },
  // Header
  header: {
    backgroundColor: '#003366',
    color: '#FFFFFF',
    padding: 15,
    marginBottom: 20,
    borderRadius: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#E0E0E0',
  },
  // Container for two columns
  container: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 15,
    gap: 15,
  },
  // Card styling
  card: {
    flex: 1,
    border: '1 solid #E0E0E0',
    borderRadius: 5,
    padding: 12,
    backgroundColor: '#F9F9F9',
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#003366',
    paddingBottom: 8,
  },
  cardIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#003366',
    color: '#FFFFFF',
    borderRadius: 3,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#003366',
  },
  // Row in card
  row: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 10,
    color: '#666666',
    flex: 1,
  },
  value: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  // Status badge
  statusBadge: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    padding: '2 8',
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 'bold',
  },
  // Student Thoughts section
  thoughtsSection: {
    border: '1 solid #E0E0E0',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#F9F9F9',
  },
  thoughtsHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#003366',
    paddingBottom: 8,
  },
  thoughtsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#003366',
    marginLeft: 10,
  },
  thoughtsContent: {
    fontSize: 11,
    color: '#333333',
    lineHeight: 1.6,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 3,
    border: '1 solid #E0E0E0',
  },
  // Timeline section
  timelineSection: {
    border: '1 solid #E0E0E0',
    borderRadius: 5,
    padding: 12,
    backgroundColor: '#F9F9F9',
  },
  timelineHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#003366',
    paddingBottom: 8,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#003366',
    marginLeft: 10,
  },
  timelineItem: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 15,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    marginRight: 12,
    marginTop: 3,
  },
  dotSubmitted: {
    backgroundColor: '#1976D2',
  },
  dotVerified: {
    backgroundColor: '#4CAF50',
  },
  timelineText: {
    fontSize: 10,
    color: '#333333',
  },
  timelineLabel: {
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#000000',
  },
  timelineTime: {
    fontSize: 9,
    color: '#666666',
  },
});

const JoiningReportPDFTemplate = ({ report }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Joining Report</Text>
          <Text style={styles.headerSubtitle}>
            {report.studentName} • Submitted on {formatDate(report.reportDate)}
          </Text>
        </View>

        {/* Two Column Layout - Student Information & Company Details */}
        <View style={styles.container}>
          {/* Student Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon} />
              <Text style={styles.cardTitle}>Student Information</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Student Name</Text>
              <Text style={styles.value}>{report.studentName || 'N/A'}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Roll Number</Text>
              <Text style={styles.value}>{report.rollNumber || 'N/A'}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{report.studentEmail || 'N/A'}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Submission Date</Text>
              <Text style={styles.value}>{formatDate(report.reportDate)}</Text>
            </View>
          </View>

          {/* Company Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon} />
              <Text style={styles.cardTitle}>Company Details</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Company Name</Text>
              <Text style={styles.value}>{report.companyName || 'N/A'}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Position</Text>
              <Text style={styles.value}>{report.position || 'N/A'}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Department</Text>
              <Text style={styles.value}>{report.department || 'N/A'}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Report Status</Text>
              <View style={styles.statusBadge}>
                <Text>
                  {report.status?.charAt(0).toUpperCase() + report.status?.slice(1) || 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Student Thoughts & Experience */}
        {report.studentThoughts && (
          <View style={styles.thoughtsSection}>
            <View style={styles.thoughtsHeader}>
              <View style={styles.cardIcon} />
              <Text style={styles.thoughtsTitle}>Student Thoughts & Experience</Text>
            </View>
            <View style={styles.thoughtsContent}>
              <Text>{report.studentThoughts}</Text>
            </View>
          </View>
        )}

        {/* Report Timeline */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <View style={styles.cardIcon} />
            <Text style={styles.timelineTitle}>Report Timeline</Text>
          </View>

          {/* Report Submitted */}
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, styles.dotSubmitted]} />
            <View>
              <Text style={styles.timelineLabel}>Report Submitted</Text>
              <Text style={styles.timelineTime}>{formatDateTime(report.reportDate)}</Text>
            </View>
          </View>

          {/* Report Verified */}
          {(report.status === 'verified' || report.status === 'Verified') && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.dotVerified]} />
              <View>
                <Text style={styles.timelineLabel}>Report Verified</Text>
                <Text style={styles.timelineTime}>Verified by supervisor</Text>
              </View>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default JoiningReportPDFTemplate;
