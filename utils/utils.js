// fetch html content from external html file
export async function fetchHtmlContent(url) {
  try {
    const response = await fetch(url); // await pauses the fetch function until the network headers are received and the Response object is available

    if (!response.ok) {
      throw new Error(`HTTP Error status: ${response.status}`);
    }

    // htmlText here is the raw string content
    const htmlText = await response.text(); // reading the body stream of the resopnse (e.g., response.text(), .json()) can take time so these methods are asynchronous

    // parse the fetched html string to DOM (or document) object - this is separate from the main DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html'); // process the string of data as a structured HTML document

    return doc;

  } catch (error) {
    console.error('Failed to fetch external html: ', error);
  }
}

// fetch and create a stylesheet
export async function getStylesheet(url) {
  try {
    const response = await fetch(url);

    if(!response.ok) {
      throw new Error(`HTTP Error status: ${response.status}`);
    }

    const cssText = await response.text();
    const stylesheet = new CSSStyleSheet();
    stylesheet.replaceSync(cssText);
    return stylesheet;
  } catch (error) {
    console.error('Could not process the source url: ', error);
  }
}
