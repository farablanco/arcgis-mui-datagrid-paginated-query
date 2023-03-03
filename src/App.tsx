import * as query from "@arcgis/core/rest/query";
import Snackbar from "@mui/material/Snackbar";
import { DataGrid, GridColumns } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);

  const [start, setStart] = useState(0);
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<GridColumns>([]);
  const [exceededTransferLimit, setExceededTransferLimit] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const snackbarOpen = snackbarMsg !== "";

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    query
      .executeQueryPBF(
        "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Counties_education_smart_mapping/FeatureServer/0",
        {
          where: "1=1",
          outFields: ["*"],
          start: start,
          num: 2000,
        }
      )
      .then((response) => {
        const fetchedRows = response.features.map((feature) => ({
          id: feature.attributes.OBJECTID,
          ...feature.attributes,
        }));
        const newRows = [...rows, ...fetchedRows];
        setRows(newRows);
        const columns = response.fields.map((field) => ({
          field: field.name,
          headerName: field.alias,
          width: 150,
        }));
        setColumns(columns);
        setExceededTransferLimit(response.exceededTransferLimit);
        if (response.exceededTransferLimit) {
          setSnackbarMsg(
            "More data available. Go to the last page to fetch more data."
          );
        }
      })
      .catch((err) => {
        const newError = new Error(err.message);
        setError(newError);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [start]);

  const handlePageChange = (newPage: number) => {
    // Detect last page
    if (exceededTransferLimit && newPage + 1 === rows.length / pageSize) {
      setSnackbarMsg("Fetching more data...");
      setStart(start + rows.length);
    }
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
  };

  const handleSnackbarClose = () => {
    setSnackbarMsg("");
  };

  return (
    <div className="App">
      <Snackbar
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        autoHideDuration={3000}
        message={snackbarMsg}
      />
      <DataGrid
        rows={rows}
        columns={columns}
        page={page}
        onPageChange={handlePageChange}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        loading={isLoading}
        error={error}
      />
    </div>
  );
}

export default App;
