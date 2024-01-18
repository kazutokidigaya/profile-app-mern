import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const AdminPanel = () => {
  const [userDetails, setUserDetails] = useState([]);

  useEffect(() => {
    // Fetch user details and their PDFs on component mount
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
  }, []);

  // Function to download a specific PDF
  const downloadPdf = async (pdfId) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/pdfs/download/${pdfId}`,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `downloaded_${pdfId}.pdf`); // Set the file name
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };
  console.log({ userDetails });
  return (
    <div className="admin-panel">
      <div className="admin-tabel-container">
        <h1>Admin Panel</h1>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Uploaded PDFs</th>
              <th>Created At</th>
              <th>Updated At</th>
            </tr>
          </thead>
          <tbody>
            {userDetails.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.mobile}</td>
                <td>
                  {user.pdfDetails.map((pdf) => (
                    <div key={pdf._id} className="pdf-download">
                      <span className="pdf-name">{pdf.fileName}</span>
                      <button onClick={() => downloadPdf(pdf._id)}>
                        Download
                      </button>
                    </div>
                  ))}
                </td>
                <td>{new Date(user.created_at).toLocaleString()}</td>
                <td>{new Date(user.updated_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;
