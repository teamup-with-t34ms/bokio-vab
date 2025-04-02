import styles from '../styles/Home.module.css';

interface XMLDownloaderProps {
  generateXML: () => string;
  isValid: boolean;
}

const XMLDownloader: React.FC<XMLDownloaderProps> = ({ generateXML, isValid }) => {
  const handleDownload = () => {
    const xmlContent = generateXML();
    if (!xmlContent) {
      alert('No XML content to download');
      return;
    }
    
    // Create a blob with the XML content
    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modified_agi.xml';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };
  
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Download Modified XML</h2>
      <p>
        Click the button below to download the XML file with your changes.
      </p>
      <button 
        onClick={handleDownload}
        disabled={!isValid}
        className={styles.button}
        style={{ opacity: isValid ? 1 : 0.5 }}
      >
        Download XML
      </button>
      {!isValid && (
        <p style={{ color: 'red' }}>
          Please resolve validation issues before downloading.
        </p>
      )}
    </div>
  );
};

export default XMLDownloader;
