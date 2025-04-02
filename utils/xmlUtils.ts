// Utility functions for working with XML data

// Using a third-party XML library, e.g., xml-js
import { xml2js, js2xml } from "xml-js";

// Define our custom option interfaces
interface ParseOptions {
  compact?: boolean;
  spaces?: number;
  ignoreComment?: boolean;
  alwaysChildren?: boolean;
}

interface GenerateOptions {
  compact?: boolean;
  spaces?: number;
  ignoreComment?: boolean;
  fullTagEmptyElement?: boolean;
  declaration?: {
    include: boolean;
    encoding: string;
    standalone: string;
  };
}

/**
 * Parse an XML string into a JavaScript object
 *
 * @param xmlString - The XML string to parse
 * @returns JavaScript object representation of the XML
 */
export const parseXML = async (xmlString: string): Promise<any> => {
  try {
    // Convert XML to JavaScript object with typed options
    const options: ParseOptions = {
      compact: true,
      spaces: 2,
      ignoreComment: true,
      alwaysChildren: true,
    };
    
    const result = xml2js(xmlString, options);
    return result;
  } catch (error) {
    console.error("Error parsing XML:", error);
    throw new Error("Failed to parse XML file");
  }
};

/**
 * Generate an XML string from a JavaScript object
 *
 * @param jsObject - JavaScript object to convert to XML
 * @returns XML string representation
 */
export const generateXML = (jsObject: any): string => {
  try {
    // Convert JavaScript object back to XML with typed options
    const options: GenerateOptions = {
      compact: true,
      spaces: 2,
      ignoreComment: false,
      fullTagEmptyElement: true,
      declaration: {
        include: true,
        encoding: "utf-8",
        standalone: "no"
      }
    };
    
    // Let xml-js handle the XML declaration
    const result = js2xml(jsObject, options);
    return result;
  } catch (error) {
    console.error("Error generating XML:", error);
    throw new Error("Failed to generate XML");
  }
};

/**
 * Extract specific data from XML object
 *
 * @param xmlObject - The parsed XML object
 * @param path - Dot notation path to the data (e.g., "Skatteverket.Blankett")
 * @returns The extracted data or undefined if not found
 */
export const extractFromXML = (xmlObject: any, path: string): any => {
  if (!xmlObject) return undefined;

  const parts = path.split(".");
  let current = xmlObject;

  for (const part of parts) {
    if (!current[part]) return undefined;
    current = current[part];
  }

  return current;
};
