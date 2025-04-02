import { useState } from 'react';
import FranvaroForm from './FranvaroForm';
import styles from '../styles/Home.module.css';

// Define interfaces for better type safety
interface XMLElement {
  _text: string;
  _attributes: { faltkod: string };
}

interface FranvaroElement {
  AgRegistreradId: XMLElement;
  BetalningsmottagarId: XMLElement;
  FranvaroDatum: XMLElement;
  FranvaroSpecifikationsnummer: XMLElement;
  FranvaroTyp: XMLElement;
  RedovisningsPeriod: XMLElement;
  FranvaroProcentFP?: XMLElement;
  FranvaroTimmarFP?: XMLElement;
  FranvaroProcentTFP?: XMLElement;
  FranvaroTimmarTFP?: XMLElement;
  FranvaroBorttag?: XMLElement;
}

interface ArendeListProps {
  arendeList: any[];
  onFranvaroUpdate: (arendeIndex: number, franvaroList: any[]) => void;
}

const ArendeList: React.FC<ArendeListProps> = ({ arendeList, onFranvaroUpdate }) => {
  const [expandedArende, setExpandedArende] = useState<number | null>(null);
  const [lastAddedDates, setLastAddedDates] = useState<Record<number, string>>({});

  const toggleExpand = (index: number) => {
    setExpandedArende(expandedArende === index ? null : index);
  };

  const handleAddFranvaro = (arendeIndex: number, franvaro: any) => {
    const currentArende = arendeList[arendeIndex];
    const existingFranvaro = currentArende.franvaroList || [];
    
    // Find max specifikationsnummer to ensure uniqueness
    const maxSpecNr = existingFranvaro.length > 0 
      ? Math.max(...existingFranvaro.map((f: any) => 
          parseInt(f.FranvaroSpecifikationsnummer?._text || '0', 10)
        )) 
      : 0;
    
    // Create a new Franvaro entry with proper structure
    const newFranvaro: FranvaroElement = {
      AgRegistreradId: {
        _text: currentArende.arendeAgare,
        _attributes: { faltkod: "201" }
      },
      BetalningsmottagarId: {
        _text: currentArende.betalningsmottagarId || franvaro.betalningsmottagarId,
        _attributes: { faltkod: "215" }
      },
      FranvaroDatum: {
        _text: franvaro.franvaroDatum,
        _attributes: { faltkod: "821" }
      },
      FranvaroSpecifikationsnummer: {
        _text: (maxSpecNr + 1).toString(),
        _attributes: { faltkod: "822" }
      },
      FranvaroTyp: {
        _text: franvaro.franvaroTyp,
        _attributes: { faltkod: "823" }
      },
      RedovisningsPeriod: {
        _text: currentArende.period,
        _attributes: { faltkod: "006" }
      }
    };
    
    // Add optional fields if they exist
    if (franvaro.franvaroProcentFP) {
      newFranvaro.FranvaroProcentFP = {
        _text: franvaro.franvaroProcentFP,
        _attributes: { faltkod: "826" }
      };
    }
    
    if (franvaro.franvaroTimmarFP) {
      newFranvaro.FranvaroTimmarFP = {
        _text: franvaro.franvaroTimmarFP,
        _attributes: { faltkod: "827" }
      };
    }
    
    if (franvaro.franvaroProcentTFP) {
      newFranvaro.FranvaroProcentTFP = {
        _text: franvaro.franvaroProcentTFP,
        _attributes: { faltkod: "824" }
      };
    }
    
    if (franvaro.franvaroTimmarTFP) {
      newFranvaro.FranvaroTimmarTFP = {
        _text: franvaro.franvaroTimmarTFP,
        _attributes: { faltkod: "825" }
      };
    }
    
    const updatedFranvaroList = [...existingFranvaro, newFranvaro];
    onFranvaroUpdate(arendeIndex, updatedFranvaroList);
    
    // Store the last added date for this arende
    setLastAddedDates({
      ...lastAddedDates,
      [arendeIndex]: franvaro.franvaroDatum
    });
  };

  const handleRemoveFranvaro = (arendeIndex: number, franvaroIndex: number) => {
    const currentArende = arendeList[arendeIndex];
    const existingFranvaro = [...currentArende.franvaroList];
    existingFranvaro.splice(franvaroIndex, 1);
    onFranvaroUpdate(arendeIndex, existingFranvaro);
  };

  if (arendeList.length === 0) {
    return <div>No Arendeinformation found in the XML file.</div>;
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Employee List</h2>
      <ul className={styles.list}>
        {arendeList.map((arende, index) => (
          <li key={index} className={styles.listItem}>
            <div>
              <strong>Personal ID:</strong> {arende.betalningsmottagarId}
              {' - '}
              <strong>Period:</strong> {arende.period}
              <button 
                onClick={() => toggleExpand(index)} 
                className={styles.button}
              >
                {expandedArende === index ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            {expandedArende === index && (
              <div style={{ marginTop: '1rem' }}>
                <h3>Current Franvarouppgift Entries</h3>
                
                {arende.franvaroList && arende.franvaroList.length > 0 ? (
                  <ul>
                    {arende.franvaroList.map((franvaro: any, franvaroIndex: number) => (
                      <li key={franvaroIndex} style={{ marginBottom: '1rem' }}>
                        <div><strong>Personal ID:</strong> {franvaro.BetalningsmottagarId?._text}</div>
                        <div><strong>Date:</strong> {franvaro.FranvaroDatum?._text}</div>
                        <div><strong>Type:</strong> {franvaro.FranvaroTyp?._text}</div>
                        <div><strong>Specification #:</strong> {franvaro.FranvaroSpecifikationsnummer?._text}</div>
                        {franvaro.FranvaroProcentFP && (
                          <div><strong>FP %:</strong> {franvaro.FranvaroProcentFP._text}</div>
                        )}
                        {franvaro.FranvaroTimmarFP && (
                          <div><strong>FP Hours:</strong> {franvaro.FranvaroTimmarFP._text}</div>
                        )}
                        {franvaro.FranvaroProcentTFP && (
                          <div><strong>TFP %:</strong> {franvaro.FranvaroProcentTFP._text}</div>
                        )}
                        {franvaro.FranvaroTimmarTFP && (
                          <div><strong>TFP Hours:</strong> {franvaro.FranvaroTimmarTFP._text}</div>
                        )}
                        <button 
                          onClick={() => handleRemoveFranvaro(index, franvaroIndex)} 
                          className={`${styles.button} ${styles.buttonDanger}`}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No Franvarouppgift entries for this employee.</p>
                )}
                
                <h3>Add New Franvarouppgift</h3>
                <FranvaroForm 
                  onSubmit={(data) => handleAddFranvaro(index, data)} 
                  betalningsmottagarId={arende.betalningsmottagarId}
                  lastAddedDate={lastAddedDates[index]}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ArendeList;
