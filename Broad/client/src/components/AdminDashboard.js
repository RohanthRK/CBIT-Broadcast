import React, { useEffect, useState } from "react";
import { Container, Typography, Card, Box, Button, Stack, Tabs, Tab } from "@mui/material";
import { getReports, resolveReport, getPendingVerifications, resolveVerification } from "../api/admin";
import { isLoggedIn } from "../helpers/authHelper";
import HorizontalStack from "./util/HorizontalStack";
import { BASE_URL } from "../config";

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [tabValue, setTabValue] = useState(0); // 0 = reports, 1 = verifications
  const user = isLoggedIn();

  const fetchReports = async () => {
    if (user && user.isAdmin) {
      const data = await getReports(user);
      if (data && !data.error) {
        setReports(data);
      }
    }
  };

  const fetchVerifications = async () => {
    if (user && user.isAdmin) {
      const data = await getPendingVerifications(user);
      if (data && !data.error) {
        setVerifications(data);
      }
    }
  };

  useEffect(() => {
    if (tabValue === 0) {
      fetchReports();
    } else {
      fetchVerifications();
    }
  }, [tabValue]);

  const handleReportAction = async (reportId, action) => {
    await resolveReport(reportId, action, user);
    setReports(reports.filter(r => r._id !== reportId));
  };

  const handleResolveVerification = async (userId, action) => {
    await resolveVerification(userId, action, user);
    setVerifications(verifications.filter(v => v._id !== userId));
  };

  if (!user || !user.isAdmin) {
    return <Typography>Access Denied</Typography>;
  }

  return (
    <Container sx={{ mt: 3, mb: 6 }}>
      <Typography variant="h4" mb={2}>Admin Dashboard</Typography>
      
      <Tabs value={tabValue} onChange={(e, newVal) => setTabValue(newVal)} sx={{ mb: 3 }}>
        <Tab label="Pending Reports" />
        <Tab label="Pending Verifications" />
      </Tabs>

      <Stack spacing={2}>
        {tabValue === 0 ? (
          reports.length === 0 ? (
            <Typography>No pending reports.</Typography>
          ) : (
            reports.map(report => (
              <Card key={report._id} sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Reported by: {report.reporterId?.username}</Typography>
                <Typography variant="body1" fontWeight="bold">Reason: {report.reason}</Typography>
                <Box mt={1} p={1} bgcolor="grey.100" borderRadius={1}>
                  <Typography variant="subtitle2">Post: {report.postId?.title}</Typography>
                  <Typography variant="body2">{report.postId?.content}</Typography>
                </Box>
                <HorizontalStack mt={2} spacing={2}>
                  <Button variant="contained" color="error" onClick={() => handleReportAction(report._id, "delete")}>Delete Post</Button>
                  <Button variant="outlined" onClick={() => handleReportAction(report._id, "dismiss")}>Dismiss Report</Button>
                </HorizontalStack>
              </Card>
            ))
          )
        ) : (
          verifications.length === 0 ? (
            <Typography>No pending verifications.</Typography>
          ) : (
            verifications.map(student => (
              <Card key={student._id} sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">College: {student.college}</Typography>
                <Typography variant="body1" fontWeight="bold">Username: {student.username}</Typography>
                <Typography variant="body2">Email: {student.email}</Typography>
                <Typography variant="body2">Roll No: {student.roll_no} | Phone: {student.ph_no}</Typography>
                <Typography variant="body2" mb={1}>Department: {student.department}</Typography>
                
                {student.collegeEmail ? (
                  <Box mt={1} p={1} bgcolor="grey.100" borderRadius={1}>
                    <Typography variant="subtitle2">Verification Method: College Email</Typography>
                    <Typography variant="body2" fontWeight="bold">{student.collegeEmail}</Typography>
                  </Box>
                ) : (
                  student.idProofUrl && (
                    <Box mt={1} p={1} bgcolor="grey.100" borderRadius={1}>
                      <Typography variant="subtitle2" mb={0.5}>Verification Method: ID Card Upload</Typography>
                      <Button variant="outlined" size="small" href={BASE_URL.slice(0, -1) + student.idProofUrl} target="_blank">
                        View ID Card Image
                      </Button>
                    </Box>
                  )
                )}
                
                <HorizontalStack mt={2} spacing={2}>
                  <Button variant="contained" color="success" onClick={() => handleResolveVerification(student._id, "approve")}>Approve Student</Button>
                  <Button variant="outlined" color="error" onClick={() => handleResolveVerification(student._id, "reject")}>Reject Student</Button>
                </HorizontalStack>
              </Card>
            ))
          )
        )}
      </Stack>
    </Container>
  );
};

export default AdminDashboard;
