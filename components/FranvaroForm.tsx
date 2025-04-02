import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';

interface FranvaroFormProps {
  onSubmit: (data: any) => void;
  betalningsmottagarId?: string; // Optional prop to prefill the ID
  lastAddedDate?: string; // New prop for the last added date
}

interface FormData {
  betalningsmottagarId: string;
  franvaroDatum: string;
  franvaroTyp: 'TILLFALLIG_FORALDRAPENNING' | 'FORALDRAPENNING';
  franvaroProcentFP: string;
  franvaroTimmarFP: string;
  franvaroProcentTFP: string;
  franvaroTimmarTFP: string;
}

const FranvaroForm: React.FC<FranvaroFormProps> = ({ 
  onSubmit, 
  betalningsmottagarId = '', 
  lastAddedDate = '' 
}) => {
  // Initialize with either the next day from lastAddedDate or today's date
  const getInitialDate = () => {
    if (lastAddedDate) {
      // Calculate next day from last added date
      const date = new Date(lastAddedDate);
      date.setDate(date.getDate() + 1);
      return date.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<FormData>({
    betalningsmottagarId: betalningsmottagarId,
    franvaroDatum: getInitialDate(),
    franvaroTyp: 'TILLFALLIG_FORALDRAPENNING',
    franvaroProcentFP: '',
    franvaroTimmarFP: '',
    franvaroProcentTFP: '',
    franvaroTimmarTFP: '8.00' // Default to 8 hours for TFP
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when betalningsmottagarId prop changes
  useEffect(() => {
    if (betalningsmottagarId) {
      setFormData(prev => ({
        ...prev,
        betalningsmottagarId
      }));
    }
  }, [betalningsmottagarId]);

  // Update date when lastAddedDate changes
  useEffect(() => {
    if (lastAddedDate) {
      const nextDay = new Date(lastAddedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setFormData(prev => ({
        ...prev,
        franvaroDatum: nextDay.toISOString().split('T')[0]
      }));
    }
  }, [lastAddedDate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear any error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate Personal ID (Swedish format)
    if (!formData.betalningsmottagarId) {
      newErrors.betalningsmottagarId = 'Personal ID is required';
    } else if (!/^\d{12}$/.test(formData.betalningsmottagarId)) {
      newErrors.betalningsmottagarId = 'Personal ID must be 12 digits (YYYYMMDDNNNN)';
    }
    
    // Validate Date
    if (!formData.franvaroDatum) {
      newErrors.franvaroDatum = 'Date is required';
    }
    
    // Validate Type selected
    if (!formData.franvaroTyp) {
      newErrors.franvaroTyp = 'Type is required';
    }
    
    // For FORALDRAPENNING, either percentage or hours should be provided
    if (formData.franvaroTyp === 'FORALDRAPENNING') {
      if (!formData.franvaroProcentFP && !formData.franvaroTimmarFP) {
        newErrors.franvaroProcentFP = 'Either percentage or hours must be provided';
        newErrors.franvaroTimmarFP = 'Either percentage or hours must be provided';
      }
      
      // Validate percentage format (0.01-100.00)
      if (formData.franvaroProcentFP && 
          (parseFloat(formData.franvaroProcentFP) < 0.01 || 
           parseFloat(formData.franvaroProcentFP) > 100 ||
           isNaN(parseFloat(formData.franvaroProcentFP)))) {
        newErrors.franvaroProcentFP = 'Percentage must be between 0.01 and 100.00';
      }
      
      // Validate hours format (0.01-24.00)
      if (formData.franvaroTimmarFP && 
          (parseFloat(formData.franvaroTimmarFP) < 0.01 || 
           parseFloat(formData.franvaroTimmarFP) > 24 ||
           isNaN(parseFloat(formData.franvaroTimmarFP)))) {
        newErrors.franvaroTimmarFP = 'Hours must be between 0.01 and 24.00';
      }
    }
    
    // For TILLFALLIG_FORALDRAPENNING, either percentage or hours should be provided
    if (formData.franvaroTyp === 'TILLFALLIG_FORALDRAPENNING') {
      if (!formData.franvaroProcentTFP && !formData.franvaroTimmarTFP) {
        newErrors.franvaroProcentTFP = 'Either percentage or hours must be provided';
        newErrors.franvaroTimmarTFP = 'Either percentage or hours must be provided';
      }
      
      // Validate percentage format (0.01-100.00)
      if (formData.franvaroProcentTFP && 
          (parseFloat(formData.franvaroProcentTFP) < 0.01 || 
           parseFloat(formData.franvaroProcentTFP) > 100 ||
           isNaN(parseFloat(formData.franvaroProcentTFP)))) {
        newErrors.franvaroProcentTFP = 'Percentage must be between 0.01 and 100.00';
      }
      
      // Validate hours format (0.01-24.00)
      if (formData.franvaroTimmarTFP && 
          (parseFloat(formData.franvaroTimmarTFP) < 0.01 || 
           parseFloat(formData.franvaroTimmarTFP) > 24 ||
           isNaN(parseFloat(formData.franvaroTimmarTFP)))) {
        newErrors.franvaroTimmarTFP = 'Hours must be between 0.01 and 24.00';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
      // Reset form after successful submission but keep the personal ID and calculate next day
      const nextDay = new Date(formData.franvaroDatum);
      nextDay.setDate(nextDay.getDate() + 1);
      
      setFormData({
        betalningsmottagarId: formData.betalningsmottagarId, // Keep the personal ID
        franvaroDatum: nextDay.toISOString().split('T')[0], // Set to next day
        franvaroTyp: 'TILLFALLIG_FORALDRAPENNING',
        franvaroProcentFP: '',
        franvaroTimmarFP: '',
        franvaroProcentTFP: '',
        franvaroTimmarTFP: '8.00' // Default to 8 hours
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="betalningsmottagarId" className={styles.label}>
          Personal ID (12 digits):
        </label>
        <input
          type="text"
          id="betalningsmottagarId"
          name="betalningsmottagarId"
          value={formData.betalningsmottagarId}
          onChange={handleChange}
          placeholder="YYYYMMDDNNNN"
          className={styles.input}
          disabled={!!betalningsmottagarId} // Disable if prefilled
        />
        {errors.betalningsmottagarId && (
          <div style={{ color: 'red' }}>{errors.betalningsmottagarId}</div>
        )}
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="franvaroDatum" className={styles.label}>
          Absence Date:
        </label>
        <input
          type="date"
          id="franvaroDatum"
          name="franvaroDatum"
          value={formData.franvaroDatum}
          onChange={handleChange}
          className={styles.input}
        />
        {errors.franvaroDatum && (
          <div style={{ color: 'red' }}>{errors.franvaroDatum}</div>
        )}
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="franvaroTyp" className={styles.label}>
          Absence Type:
        </label>
        <select
          id="franvaroTyp"
          name="franvaroTyp"
          value={formData.franvaroTyp}
          onChange={handleChange}
          className={styles.input}
        >
          <option value="TILLFALLIG_FORALDRAPENNING">TILLFALLIG_FORALDRAPENNING (VAB)</option>
          <option value="FORALDRAPENNING">FORALDRAPENNING</option>
        </select>
        {errors.franvaroTyp && (
          <div style={{ color: 'red' }}>{errors.franvaroTyp}</div>
        )}
      </div>

      {formData.franvaroTyp === 'FORALDRAPENNING' && (
        <>
          <div className={styles.formGroup}>
            <label htmlFor="franvaroProcentFP" className={styles.label}>
              Absence Percentage (FP):
            </label>
            <input
              type="number"
              id="franvaroProcentFP"
              name="franvaroProcentFP"
              value={formData.franvaroProcentFP}
              onChange={handleChange}
              min="0.01"
              max="100"
              step="0.01"
              placeholder="e.g., 50.00"
              className={styles.input}
            />
            {errors.franvaroProcentFP && (
              <div style={{ color: 'red' }}>{errors.franvaroProcentFP}</div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="franvaroTimmarFP" className={styles.label}>
              Absence Hours (FP):
            </label>
            <input
              type="number"
              id="franvaroTimmarFP"
              name="franvaroTimmarFP"
              value={formData.franvaroTimmarFP}
              onChange={handleChange}
              min="0.01"
              max="24"
              step="0.01"
              placeholder="e.g., 8.00"
              className={styles.input}
            />
            {errors.franvaroTimmarFP && (
              <div style={{ color: 'red' }}>{errors.franvaroTimmarFP}</div>
            )}
          </div>
        </>
      )}
      
      {formData.franvaroTyp === 'TILLFALLIG_FORALDRAPENNING' && (
        <>
          <div className={styles.formGroup}>
            <label htmlFor="franvaroProcentTFP" className={styles.label}>
              Absence Percentage (TFP):
            </label>
            <input
              type="number"
              id="franvaroProcentTFP"
              name="franvaroProcentTFP"
              value={formData.franvaroProcentTFP}
              onChange={handleChange}
              min="0.01"
              max="100"
              step="0.01"
              placeholder="e.g., 50.00"
              className={styles.input}
            />
            {errors.franvaroProcentTFP && (
              <div style={{ color: 'red' }}>{errors.franvaroProcentTFP}</div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="franvaroTimmarTFP" className={styles.label}>
              Absence Hours (TFP):
            </label>
            <input
              type="number"
              id="franvaroTimmarTFP"
              name="franvaroTimmarTFP"
              value={formData.franvaroTimmarTFP}
              onChange={handleChange}
              min="0.01"
              max="24"
              step="0.01"
              placeholder="e.g., 8.00"
              className={styles.input}
            />
            {errors.franvaroTimmarTFP && (
              <div style={{ color: 'red' }}>{errors.franvaroTimmarTFP}</div>
            )}
          </div>
        </>
      )}
      
      <button type="submit" className={styles.button}>
        Add Absence Record
      </button>
    </form>
  );
};

export default FranvaroForm;
