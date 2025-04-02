import { useState, useRef } from 'react';
import styles from '../styles/Home.module.css';

interface XMLUploaderProps {
  onFileUpload: (fileContent: string) => void;
}

const XMLUploader: React.FC<XMLUploaderProps> = ({ onFileUpload }) => {
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }

    if (file.type !== 'text/xml' && !file.name.endsWith('.xml')) {
      setError('Please upload an XML file');
      return;
    }

    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        onFileUpload(content);
      } catch (err) {
        console.error('Error reading the file:', err);
        setError('Error reading the file. Please try another file.');
      }
    };
    reader.onerror = () => {
      setError('Error reading the file. Please try another file.');
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFileName('');
    setError(null);
    // Upload an empty string to reset the application state
    onFileUpload('');
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Upload XML File</h2>
      <div className={styles.fileUploadForm}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="xmlFile">
            Select an XML file:
          </label>
          <input
            ref={fileInputRef}
            type="file"
            id="xmlFile"
            accept=".xml"
            onChange={handleFileChange}
            className={`${styles.input} ${styles.fileInput}`}
          />
        </div>

        {fileName && (
          <p className={styles.fileName}>
            <strong>Selected file:</strong> {fileName}
          </p>
        )}

        {error && <p className={styles.errorText}>{error}</p>}

        <button
          onClick={handleReset}
          className={`${styles.button} ${styles.buttonSecondary} ${styles.resetButton}`}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default XMLUploader;
