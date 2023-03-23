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
  const [rowCount, setRowCount] = useState<number>(0);
  const [columns, setColumns] = useState<GridColumns>([]);
  const [exceededTransferLimit, setExceededTransferLimit] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const snackbarOpen = snackbarMsg !== "";

  // Effect to retrieve total number of rows
  useEffect(() => {
    query
      .executeForCount(
        "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Counties_education_smart_mapping/FeatureServer/0",
        {
          where: "1=1",
        }
      )
      .then((count) => {
        setRowCount((prevRowCount) =>
          count !== undefined ? count : prevRowCount
        );
      })
      .catch((err) => {
        const newError = new Error(err.message);
        setError(newError);
      });
  }, []); // assumes that total row count does not change frequently; modify according to needs

  useEffect(() => {
    // setIsLoading(true);
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
        // if (response.exceededTransferLimit) {
        //   setSnackbarMsg(
        //     "More data available. Go to the last page to fetch more data."
        //   );
        // }
      })
      .catch((err) => {
        const newError = new Error(err.message);
        setError(newError);
      })
      .finally(() => {
        // Enable the next page button
        if (rows.length !== rowCount) {
          const nextPageButton = document.querySelector(
            '[aria-label="Go to next page"]'
          ) as HTMLButtonElement;
          nextPageButton.classList.remove("Mui-disabled");
        }
        setIsLoading(false);
      });
  }, [start]);

  const handlePageChange = (newPage: number) => {
    // Detect last page
    // if (exceededTransferLimit && newPage + 1 === rows.length / pageSize) {
    //   setSnackbarMsg("Fetching more data...");
    //   setStart(start + rows.length);
    // }

    // using number of records instead of pages because the right page number is dependent on page size

    // fetchThreshold represents undisplayed number of rows left which, when reached, triggers a fetch of new set of rows
    const fetchThreshold = 300;

    // Check if the threshold has been reached, and if it has, trigger a fetch
    // [pageSize * newPage] - the number of rows that have been displayed thus far
    // [rows.length] - the current total number of rows fetched from the service
    if (rows.length - pageSize * newPage < fetchThreshold) {
      setStart(rows.length);
    }

    // Provision for when the last page has been reached, but not all rows have been fetched
    // This can happen for slow networks or when the fetchThreshold set is too low
    const lastPage = rows.length / pageSize;
    if (newPage === lastPage && rows.length < rowCount) {
      // show table spinner
      setIsLoading(true);
      // disable the next page button
      const nextPageButton = document.querySelector(
        '[aria-label="Go to next page"]'
      ) as HTMLButtonElement;
      nextPageButton.classList.add("Mui-disabled");
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
        rowCount={rowCount}
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
