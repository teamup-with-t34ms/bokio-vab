/**
 * This module provides functions to validate XML against XSD schemas.
 * In a browser environment, full XSD validation can be challenging.
 * This implementation performs basic validation checks relevant to our use case.
 */

import { parseXML } from './xmlUtils';

/**
 * Safely access text content from a potentially nested XML object
 */
const getTextContent = (obj: any): string => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (obj._text) return obj._text;
  return '';
};

/**
 * Validates an XML string against our requirements
 * 
 * @param xmlString - The XML string to validate
 * @returns Object with validation result and any errors
 */
export const validateXML = async (xmlString: string): Promise<{ valid: boolean; errors: string[] }> => {
  const errors: string[] = [];
  
  // Exit early if the XML string is empty
  if (!xmlString) {
    return { valid: false, errors: ['No XML content provided'] };
  }
  
  try {
    // Parse the XML first
    const parsedXml = await parseXML(xmlString);
    
    // Check if this is a Skatteverket XML
    if (!parsedXml || !parsedXml.Skatteverket) {
      errors.push('XML does not contain a Skatteverket root element');
      return { valid: false, errors };
    }
    
    // Check for required namespaces
    const rootElement = parsedXml.Skatteverket;
    if (!rootElement._attributes || 
        !rootElement._attributes['xmlns:xsi'] ||
        !rootElement._attributes['xmlns']) {
      errors.push('Required XML namespaces are missing');
    }
    
    // Check for basic required elements in the arbetsgivardeklaration
    if (!rootElement.Avsandare) {
      errors.push('Required element Avsandare is missing');
    } else {
      // Validate Avsandare
      const avsandare = rootElement.Avsandare;
      
      if (!avsandare.Programnamn || !getTextContent(avsandare.Programnamn)) {
        errors.push('Programnamn is missing in Avsandare');
      }
      
      if (!avsandare.Organisationsnummer || !getTextContent(avsandare.Organisationsnummer)) {
        errors.push('Organisationsnummer is missing in Avsandare');
      } else if (!/^\d{12}$/.test(getTextContent(avsandare.Organisationsnummer))) {
        errors.push('Organisationsnummer must be 12 digits');
      }
      
      if (!avsandare.TekniskKontaktperson) {
        errors.push('TekniskKontaktperson is missing in Avsandare');
      } else {
        // Validate TekniskKontaktperson
        const kontaktperson = avsandare.TekniskKontaktperson;
        
        if (!kontaktperson.Namn || !getTextContent(kontaktperson.Namn)) {
          errors.push('Namn is missing in TekniskKontaktperson');
        }
        
        if (!kontaktperson.Telefon || !getTextContent(kontaktperson.Telefon)) {
          errors.push('Telefon is missing in TekniskKontaktperson');
        }
        
        if (!kontaktperson.Epostadress || !getTextContent(kontaktperson.Epostadress)) {
          errors.push('Epostadress is missing in TekniskKontaktperson');
        } else if (!/\w+@\w+\.\w+/.test(getTextContent(kontaktperson.Epostadress))) {
          errors.push('Epostadress has invalid format');
        }
      }
      
      if (!avsandare.Skapad || !getTextContent(avsandare.Skapad)) {
        errors.push('Skapad is missing in Avsandare');
      }
    }
    
    // Check for at least one Blankett
    if (!rootElement.Blankett) {
      errors.push('No Blankett elements found');
    } else {
      const blanketter = Array.isArray(rootElement.Blankett) 
        ? rootElement.Blankett 
        : [rootElement.Blankett];
      
      // Validate each Blankett
      blanketter.forEach((blankett: any, index: number) => {
        if (!blankett.Arendeinformation) {
          errors.push(`Arendeinformation is missing in Blankett ${index + 1}`);
        } else {
          // Validate Arendeinformation
          const arendeInfo = blankett.Arendeinformation;
          
          if (!arendeInfo.Arendeagare || !getTextContent(arendeInfo.Arendeagare)) {
            errors.push(`Arendeagare is missing in Blankett ${index + 1}`);
          } else if (!/^\d{12}$/.test(getTextContent(arendeInfo.Arendeagare))) {
            errors.push(`Arendeagare must be 12 digits in Blankett ${index + 1}`);
          }
          
          if (!arendeInfo.Period || !getTextContent(arendeInfo.Period)) {
            errors.push(`Period is missing in Blankett ${index + 1}`);
          }
        }
        
        if (!blankett.Blankettinnehall) {
          errors.push(`Blankettinnehall is missing in Blankett ${index + 1}`);
        }
      });
    }
    
    // Validate any existing Franvarouppgift elements
    if (rootElement.Franvarouppgift) {
      const franvaroList = Array.isArray(rootElement.Franvarouppgift)
        ? rootElement.Franvarouppgift
        : [rootElement.Franvarouppgift];
      
      franvaroList.forEach((franvaro: any, index: number) => {
        // Required elements for Franvarouppgift
        if (!franvaro.AgRegistreradId || !getTextContent(franvaro.AgRegistreradId)) {
          errors.push(`AgRegistreradId is missing in Franvarouppgift ${index + 1}`);
        }
        
        if (!franvaro.BetalningsmottagarId || !getTextContent(franvaro.BetalningsmottagarId)) {
          errors.push(`BetalningsmottagarId is missing in Franvarouppgift ${index + 1}`);
        } else if (!/^\d{12}$/.test(getTextContent(franvaro.BetalningsmottagarId))) {
          errors.push(`BetalningsmottagarId must be 12 digits in Franvarouppgift ${index + 1}`);
        }
        
        if (!franvaro.FranvaroDatum || !getTextContent(franvaro.FranvaroDatum)) {
          errors.push(`FranvaroDatum is missing in Franvarouppgift ${index + 1}`);
        }
        
        if (!franvaro.FranvaroSpecifikationsnummer || !getTextContent(franvaro.FranvaroSpecifikationsnummer)) {
          errors.push(`FranvaroSpecifikationsnummer is missing in Franvarouppgift ${index + 1}`);
        }
        
        if (!franvaro.FranvaroTyp || !getTextContent(franvaro.FranvaroTyp)) {
          errors.push(`FranvaroTyp is missing in Franvarouppgift ${index + 1}`);
        } else if (!['TILLFALLIG_FORALDRAPENNING', 'FORALDRAPENNING'].includes(getTextContent(franvaro.FranvaroTyp))) {
          errors.push(`FranvaroTyp must be either TILLFALLIG_FORALDRAPENNING or FORALDRAPENNING in Franvarouppgift ${index + 1}`);
        }
        
        if (!franvaro.RedovisningsPeriod || !getTextContent(franvaro.RedovisningsPeriod)) {
          errors.push(`RedovisningsPeriod is missing in Franvarouppgift ${index + 1}`);
        }
        
        // Check for either percentage or hours based on the type
        if (getTextContent(franvaro.FranvaroTyp) === 'FORALDRAPENNING') {
          if (!getTextContent(franvaro.FranvaroProcentFP) && !getTextContent(franvaro.FranvaroTimmarFP)) {
            errors.push(`Either FranvaroProcentFP or FranvaroTimmarFP is required for FORALDRAPENNING in Franvarouppgift ${index + 1}`);
          }
        }
        
        if (getTextContent(franvaro.FranvaroTyp) === 'TILLFALLIG_FORALDRAPENNING') {
          if (!getTextContent(franvaro.FranvaroProcentTFP) && !getTextContent(franvaro.FranvaroTimmarTFP)) {
            errors.push(`Either FranvaroProcentTFP or FranvaroTimmarTFP is required for TILLFALLIG_FORALDRAPENNING in Franvarouppgift ${index + 1}`);
          }
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
    
  } catch (error) {
    console.error('Error during validation:', error);
    return { 
      valid: false, 
      errors: ['Failed to validate XML: ' + (error instanceof Error ? error.message : 'Unknown error')] 
    };
  }
};
