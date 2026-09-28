// src/components/ExcelUploadsMonitor.jsx
import React from "react";

const ExcelUploadsMonitor = ({ farmers }) => {
  // Create a mapping of distinct uploads.
  // We assume each Farmer record stores the same file name and date for each row from that file.
  const uploadsMap = {};
  farmers.forEach((farmer) => {
    if (farmer.excelFileName && farmer.excelUploadDate) {
      // If this file hasn't been added yet, add it.
      if (!uploadsMap[farmer.excelFileName]) {
        uploadsMap[farmer.excelFileName] = new Date(farmer.excelUploadDate);
      }
    }
  });

  // Convert the map into an array.
  const uploads = Object.keys(uploadsMap).map((fileName) => ({
    excelFileName: fileName,
    excelUploadDate: uploadsMap[fileName],
  }));

  // Sort by upload date descending (latest first).
  uploads.sort((a, b) => b.excelUploadDate - a.excelUploadDate);

  return (
    <div style={{ marginTop: "1rem" }}>
      <h4>Excel Upload History</h4>
      {uploads.length > 0 ? (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Excel File Name</th>
              <th>Upload Date</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((upload, index) => (
              <tr key={index}>
                <td>{upload.excelFileName}</td>
                <td>{upload.excelUploadDate.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No Excel files uploaded yet.</p>
      )}
    </div>
  );
};

export default ExcelUploadsMonitor;
