import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Grid,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import type { ShipmentData } from '../types';

interface ShipmentFormProps {
  shipment: ShipmentData;
  onChange: (shipment: ShipmentData) => void;
}

const ShipmentForm: React.FC<ShipmentFormProps> = ({ shipment, onChange }) => {
  const handleChange = (field: keyof ShipmentData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({ ...shipment, [field]: e.target.value });
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and max 3 digits
    if (/^\d{0,3}$/.test(value)) {
      onChange({ ...shipment, customer: value });
    }
  };

  const handleClear = () => {
    onChange({
      shipmentNumber: '',
      customer: '',
      supplyDate: '',
      pocName: '',
      pocPhone: '',
    });
  };

  // Format date input to DD/MM/YYYY for display
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Input type="date" gives us YYYY-MM-DD, we need DD/MM/YYYY
    if (value) {
      const [year, month, day] = value.split('-');
      onChange({ ...shipment, supplyDate: `${day}/${month}/${year}` });
    } else {
      onChange({ ...shipment, supplyDate: '' });
    }
  };

  // Convert DD/MM/YYYY back to YYYY-MM-DD for input type="date"
  const getDateInputValue = (): string => {
    if (!shipment.supplyDate) return '';
    const parts = shipment.supplyDate.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title="פרטי משלוח"
        titleTypographyProps={{ variant: 'h6' }}
        action={
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ClearIcon />}
            onClick={handleClear}
            size="small"
          >
            נקה משלוח
          </Button>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="מס' תעודת משלוח"
              value={shipment.shipmentNumber}
              onChange={handleChange('shipmentNumber')}
              required
              placeholder="הזן מספר משלוח"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="לקוח"
              value={shipment.customer}
              onChange={handleCustomerChange}
              required
              placeholder="3 ספרות בלבד"
              inputProps={{ maxLength: 3, inputMode: 'numeric' }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="מועד אספקת ציוד"
              type="date"
              value={getDateInputValue()}
              onChange={handleDateChange}
              required
              InputLabelProps={{ shrink: true }}
              helperText="DD/MM/YYYY"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="POC - שם"
              value={shipment.pocName}
              onChange={handleChange('pocName')}
              placeholder="שם איש קשר"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="POC - טלפון"
              value={shipment.pocPhone}
              onChange={handleChange('pocPhone')}
              placeholder="טלפון איש קשר"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card >
  );
};

export default ShipmentForm;
