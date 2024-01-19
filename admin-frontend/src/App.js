import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    // Fetch user details only if logged in
    if (isLoggedIn) {
      const fetchUserDetails = async () => {
        try {
          const response = await axios.get(
            "http://localhost:3000/api/users/details"
          );
          setUserDetails(response.data);
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      };
      fetchUserDetails();
    }
  }, [isLoggedIn]);

  const handleLogin = (e) => {
    e.preventDefault();
    const { username, password } = credentials;

    if (
      username === process.env.REACT_APP_USERNAME &&
      password === process.env.REACT_APP_PASSWORD
    ) {
      setIsLoggedIn(true);
      setError(""); // Clear any previous error messages
    } else {
      setIsLoggedIn(false);
      setError("Please input correct credentials.");
    }
  };

  const handleInputChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const downloadPdf = async (pdfId) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/pdfs/download/${pdfId}`,
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

  console.log({ userDetails });

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
