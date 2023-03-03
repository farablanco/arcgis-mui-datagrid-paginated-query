import * as query from "@arcgis/core/rest/query";
import { DataGrid, GridColumns } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [data, setData] = useState<{
    rows: any[];
    columns: GridColumns;
    exceededTransferLimit: boolean;
  }>({ rows: [], columns: [], exceededTransferLimit: false });
  const [start, setStart] = useState(0);

  const { isFetching } = useQuery(
    ["test", start],
    async () => {
      const response = await query.executeQueryPBF(
        "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Counties_education_smart_mapping/FeatureServer/0",
        {
          where: "1=1",
          outFields: ["*"],
          start: start,
          num: 2000,
        }
      );
      const rows = response.features.map((feature) => ({
        id: feature.attributes.OBJECTID,
        ...feature.attributes,
      }));
      const columns = response.fields.map((field) => ({
        field: field.name,
        headerName: field.alias,
        width: 150,
      }));
      console.log({
        length: response.features.length,
        exceededTransferLimit: response.exceededTransferLimit,
      });
      return {
        rows,
        columns,
        exceededTransferLimit: response.exceededTransferLimit,
      };
    },
    {
      onSuccess: (newData) => {
        const newRows = [...data.rows, ...newData.rows];
        setData({
          rows: newRows,
          columns: newData.columns,
          exceededTransferLimit: newData.exceededTransferLimit,
        });
      },
    }
  );

  const handlePageChange = (newPage: number) => {
    // Detect last page
    if (
      data.exceededTransferLimit &&
      newPage + 1 === data.rows.length / pageSize
    ) {
      console.log("fetching more data");
      setStart(start + data.rows.length);
    }
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
  };

  return (
    <div className="App">
      <DataGrid
        rows={data.rows}
        columns={data.columns}
        page={page}
        onPageChange={handlePageChange}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        loading={isFetching}
      />
    </div>
  );
}

export default App;
