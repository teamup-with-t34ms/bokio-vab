import { useState, useEffect } from 'react';
import Head from 'next/head';
import XMLUploader from '../components/XMLUploader';
import ArendeList from '../components/ArendeList';
import XMLDownloader from '../components/XMLDownloader';
import { parseXML, generateXML } from '../utils/xmlUtils';
import { validateXML } from '../utils/xmlValidator';
import styles from '../styles/Home.module.css';

// Helper to safely get text from XML objects
const getTextContent = (obj: any): string => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (obj._text) return obj._text;
  return '';
};

export default function Home() {
  const [xmlContent, setXmlContent] = useState<any>(null);
  const [parsedXml, setParsedXml] = useState<any>(null);
  const [arendeInfoList, setArendeInfoList] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState<boolean>(false);
  
  useEffect(() => {
    if (parsedXml) {
      extractArendeInformation();
      validateUploadedXML();
    }
  }, [parsedXml]);

  const handleFileUpload = async (fileContent: string) => {
    if (!fileContent) {
      // Reset state
      setXmlContent(null);
      setParsedXml(null);
      setArendeInfoList([]);
      setValidationErrors([]);
      setIsValid(false);
      return;
    }
    
    setXmlContent(fileContent);
    const parsed = await parseXML(fileContent);
    setParsedXml(parsed);
  };

  const extractArendeInformation = () => {
    if (!parsedXml) return;

    // Extract all Blankett elements that contain an IU element
    const blanketter = parsedXml.Skatteverket?.Blankett || [];
    const allBlanketter = Array.isArray(blanketter) ? blanketter : [blanketter];
    
    // Filter for blanketter containing IU
    const iuBlanketter = allBlanketter.filter((blankett: any) => {
      return blankett.Blankettinnehall && blankett.Blankettinnehall.IU;
    });
    
    const arendeInfos = iuBlanketter.map((blankett: any, index: number) => {
      const arendeInfo = blankett.Arendeinformation;
      const blankettInnehall = blankett.Blankettinnehall;
      const iuData = blankettInnehall.IU;
      
      // Get text content safely from XML objects
      const arendeAgare = getTextContent(arendeInfo.Arendeagare);
      const period = getTextContent(arendeInfo.Period);
      
      // Get the BetalningsmottagarId
      const betalningsmottagarId = getTextContent(
        iuData.BetalningsmottagareIUGROUP?.BetalningsmottagareIDChoice?.BetalningsmottagarId
      );
      
      // Find existing Franvarouppgift elements if any for this Betalningsmottagare
      let existingFranvaro: any[] = [];
      
      if (parsedXml.Skatteverket?.Franvarouppgift) {
        if (Array.isArray(parsedXml.Skatteverket.Franvarouppgift)) {
          existingFranvaro = parsedXml.Skatteverket.Franvarouppgift.filter((f: any) => 
            getTextContent(f.BetalningsmottagarId) === betalningsmottagarId && 
            getTextContent(f.RedovisningsPeriod) === period
          );
        } else {
          const franvaro = parsedXml.Skatteverket.Franvarouppgift;
          if (
            getTextContent(franvaro.BetalningsmottagarId) === betalningsmottagarId &&
            getTextContent(franvaro.RedovisningsPeriod) === period
          ) {
            existingFranvaro = [franvaro];
          }
        }
      }
      
      return {
        index,
        arendeAgare,
        period,
        betalningsmottagarId,
        blankettInnehall,
        franvaroList: existingFranvaro
      };
    });

    setArendeInfoList(arendeInfos);
  };

  const validateUploadedXML = async () => {
    if (!xmlContent) return;
    try {
      const { valid, errors } = await validateXML(xmlContent);
      setIsValid(valid);
      setValidationErrors(errors);
    } catch (error) {
      console.error('Validation error:', error);
      setIsValid(false);
      setValidationErrors(['Failed to validate XML file']);
    }
  };

  const handleFranvaroUpdate = (arendeIndex: number, franvaroList: any[]) => {
    const updatedArendeList = [...arendeInfoList];
    updatedArendeList[arendeIndex] = {
      ...updatedArendeList[arendeIndex],
      franvaroList
    };
    setArendeInfoList(updatedArendeList);
  };

  const generateModifiedXML = () => {
    if (!parsedXml) return '';
    
    // Collect all Franvaro entries from all Arende
    const allFranvaro = arendeInfoList.flatMap(arende => arende.franvaroList);
    
    // Update XML with new Franvarouppgift entries and change Programnamn
    const modifiedXml = {
      ...parsedXml,
      Skatteverket: {
        ...parsedXml.Skatteverket,
        Franvarouppgift: allFranvaro.length > 0 ? allFranvaro : undefined,
        Avsandare: {
          ...parsedXml.Skatteverket.Avsandare,
          Programnamn: {
            ...parsedXml.Skatteverket.Avsandare.Programnamn,
            _text: "Bokio och vänner"
          }
        }
      }
    };
    
    return generateXML(modifiedXml);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Bokio VAB - XML Editor</title>
        <meta name="description" content="XML editor for Arbetsgivardeklaration" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Bokio VAB - XML Editor</h1>

        <XMLUploader onFileUpload={handleFileUpload} />
        
        {validationErrors.length > 0 && (
          <div className={styles.validationErrors}>
            <h3>Validation Errors:</h3>
            <ul>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        {arendeInfoList.length > 0 && (
          <>
            <ArendeList 
              arendeList={arendeInfoList} 
              onFranvaroUpdate={handleFranvaroUpdate} 
            />
            
            <XMLDownloader 
              generateXML={generateModifiedXML} 
              isValid={isValid && arendeInfoList.length > 0} 
            />
          </>
        )}
      </main>
    </div>
  );
}
