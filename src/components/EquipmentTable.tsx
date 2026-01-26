import React, { useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { EquipmentRow, EquipmentColumn } from '../types';

interface EquipmentTableProps {
  equipment: EquipmentRow[];
  onChange: (equipment: EquipmentRow[]) => void;
  nextId: number;
  setNextId: (id: number) => void;
}

// Column definitions in display order (RTL)
const columns: EquipmentColumn[] = [
  { key: 'rowNum', header: 'מס"ד', width: '60px' },
  { key: 'manufacturerNum', header: 'מס\' יצרן *', width: '90px' },
  { key: 'manufacturerName', header: 'שם יצרן *', width: '100px' },
  { key: 'equipmentVersion', header: 'גרסת הציוד', width: '90px' },
  { key: 'idfCatalog', header: 'מק"ט צהלי', width: '100px' },
  { key: 'serialNum', header: 'מס\' סיריאלי', width: '100px' },
  { key: 'purchaseQty', header: 'כמות רכש', width: '80px' },
  { key: 'testQty', header: 'כמות לבדיקה *', width: '80px' },
  { key: 'purchaseOrder', header: 'הזמנת רכש', width: '100px' },
];

const EquipmentTable: React.FC<EquipmentTableProps> = ({
  equipment,
  onChange,
  nextId,
  setNextId,
}) => {
  const tableRef = useRef<HTMLTableElement>(null);

  const createEmptyRow = (id: number, rowNum: string): EquipmentRow => ({
    id,
    rowNum,
    manufacturerNum: '',
    manufacturerName: '',
    equipmentVersion: '',
    idfCatalog: '',
    serialNum: '',
    purchaseQty: '',
    testQty: '',
    purchaseOrder: '',
  });

  const handleAddRow = () => {
    const newRow = createEmptyRow(nextId, String(equipment.length + 1));
    onChange([...equipment, newRow]);
    setNextId(nextId + 1);
  };

  const handleDeleteRow = (id: number) => {
    const filtered = equipment.filter((row) => row.id !== id);
    // Re-number rows
    const renumbered = filtered.map((row, index) => ({
      ...row,
      rowNum: String(index + 1),
    }));
    onChange(renumbered);
  };

  const handleDuplicateRow = (row: EquipmentRow) => {
    const newRow: EquipmentRow = {
      ...row,
      id: nextId,
      rowNum: String(equipment.length + 1),
    };
    onChange([...equipment, newRow]);
    setNextId(nextId + 1);
  };

  const handleClearTable = () => {
    onChange([]);
  };

  const handleCellChange = (
    id: number,
    field: keyof Omit<EquipmentRow, 'id'>,
    value: string
  ) => {
    let updatedValue = value;

    // If serial number is being updated and has value, force quantities to 1
    if (field === 'serialNum' && value.trim() !== '') {
      const updated = equipment.map((row) =>
        row.id === id
          ? {
            ...row,
            [field]: value,
            purchaseQty: '1',
            testQty: '1',
          }
          : row
      );
      onChange(updated);
      return;
    }

    const updated = equipment.map((row) =>
      row.id === id ? { ...row, [field]: updatedValue } : row
    );
    onChange(updated);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    rowIndex: number,
    colIndex: number
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const isLastRow = rowIndex === equipment.length - 1;
      const isLastCol = colIndex === columns.length - 1;

      if (isLastRow && isLastCol) {
        // Add new row when Enter pressed on last cell of last row
        handleAddRow();
        // Focus will be set after state update
        setTimeout(() => {
          const inputs = tableRef.current?.querySelectorAll('input');
          if (inputs) {
            const newRowFirstInput = inputs[inputs.length - columns.length];
            newRowFirstInput?.focus();
          }
        }, 50);
      } else if (isLastCol) {
        // Move to first cell of next row
        setTimeout(() => {
          const inputs = tableRef.current?.querySelectorAll('input');
          if (inputs) {
            const nextRowFirstInput = inputs[(rowIndex + 1) * columns.length];
            nextRowFirstInput?.focus();
          }
        }, 0);
      } else {
        // Move to next cell
        setTimeout(() => {
          const inputs = tableRef.current?.querySelectorAll('input');
          if (inputs) {
            const nextInput = inputs[rowIndex * columns.length + colIndex + 1];
            nextInput?.focus();
          }
        }, 0);
      }
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title="פרטי ציוד"
        titleTypographyProps={{ variant: 'h6' }}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddRow}
              size="small"
            >
              הוסף שורה
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<ClearAllIcon />}
              onClick={handleClearTable}
              size="small"
              disabled={equipment.length === 0}
            >
              נקה טבלה
            </Button>
          </Box>
        }
      />
      <CardContent>
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table ref={tableRef} size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: 'primary.main',
                      color: 'white',
                      minWidth: col.width,
                      textAlign: 'center',
                    }}
                  >
                    {col.header}
                  </TableCell>
                ))}
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    width: '100px',
                    textAlign: 'center',
                  }}
                >
                  פעולות
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equipment.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}
                  >
                    אין שורות. לחץ על "הוסף שורה" להוספת ציוד.
                  </TableCell>
                </TableRow>
              ) : (
                equipment.map((row, rowIndex) => (
                  <TableRow key={row.id} hover>
                    {columns.map((col, colIndex) => (
                      <TableCell key={col.key} sx={{ p: 0.5 }}>
                        <TextField
                          size="small"
                          variant="outlined"
                          value={row[col.key]}
                          onChange={(e) =>
                            handleCellChange(row.id, col.key, e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                          fullWidth
                          disabled={
                            (col.key === 'purchaseQty' || col.key === 'testQty') &&
                            row.serialNum.trim() !== ''
                          }
                          inputProps={{
                            style: {
                              textAlign: 'center',
                              padding: '6px 8px',
                              fontSize: '13px',
                            },
                          }}
                          error={
                            (col.key === 'manufacturerNum' || col.key === 'manufacturerName' || col.key === 'testQty') &&
                            row[col.key].trim() === ''
                          }
                        />
                      </TableCell>
                    ))}
                    <TableCell sx={{ p: 0.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="שכפל שורה">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleDuplicateRow(row)}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="מחק שורה">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteRow(row.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {equipment.length > 0 && (
          <Box sx={{ mt: 1, textAlign: 'left', color: 'text.secondary', fontSize: '12px' }}>
            סה"כ שורות: {equipment.length}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default EquipmentTable;
