import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const AdminPanel = () => {
  const [userDetails, setUserDetails] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    const authString = `${encodeURIComponent(
      credentials.username
    )}:${encodeURIComponent(credentials.password)}`;
    const authBase64 = btoa(authString);
    console.log(authBase64);
    console.log(authString);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/users/details`,
        {
          headers: {
            Authorization: `Basic ${authBase64}`,
          },
        }
      );
      setUserDetails(response.data);
      setIsLoggedIn(true);
      setError("");
    } catch (error) {
      setIsLoggedIn(false);
      setError("Authentication failed. Please check your credentials.");
      console.error("Error fetching user details:", error);
    }
  };

  const handleInputChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const downloadPdf = async (pdfId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/pdfs/download/${pdfId}`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `downloaded_${pdfId}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  // Format date or return placeholder
  const formatDate = (date) => {
    return date ? new Date(date).toLocaleString() : "Not Available";
  };

  if (!isLoggedIn) {
    return (
      <div className="login-main">
        <div className="login-container">
          <form onSubmit={handleLogin}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              onChange={handleInputChange}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleInputChange}
            />
            <button type="submit">Login</button>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>Uploaded PDFs</th>
            </tr>
          </thead>
          <tbody>
            {userDetails.map((user) => (
              <tr key={user._id}>
                <td>{user.name || "Unregistered"}</td>
                <td>{user.email || "N/A"}</td>
                <td>{user.mobile || "N/A"}</td>
                <td>{formatDate(user.created_at)}</td>
                <td>{formatDate(user.updated_at)}</td>
                <td>
                  {user.pdfDetails && user.pdfDetails.length > 0
                    ? user.pdfDetails.map((pdf) => (
                        <div key={pdf._id} className="pdf-download">
                          <span className="pdf-name">{pdf.fileName}</span>
                          <button onClick={() => downloadPdf(pdf._id)}>
                            Download
                          </button>
                        </div>
                      ))
                    : "No PDFs"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;
