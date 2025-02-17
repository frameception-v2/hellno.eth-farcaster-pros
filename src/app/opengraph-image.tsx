import { ImageResponse } from "next/server";
import { PROJECT_TITLE, PROJECT_DESCRIPTION } from "~/lib/constants";
import { readFileSync } from "fs";
import { join } from "path";

export const alt = PROJECT_TITLE;
export const contentType = "image/png";

// Function to load font with error handling
async function loadFont(fontPath: string): Promise<Buffer> {
  try {
    // Try to load font synchronously
    return readFileSync(fontPath);
  } catch (error) {
    // Fallback to loading from public directory
    try {
      const absolutePath = join(
        process.cwd(),
        "public",
        "fonts", 
        fontPath.split("/").pop()!
      );
      return readFileSync(absolutePath);
    } catch (fallbackError) {
      throw new Error(`Failed to load font ${fontPath}: ${error}`);
    }
  }
}

// Create reusable options object
let imageOptions: any = null;

// Initialize fonts
async function initializeFonts() {
  if (imageOptions) return imageOptions;

  try {
    const regularFont = await loadFont(
      join(process.cwd(), "public/fonts/Nunito-Regular.ttf")
    );
    const semiBoldFont = await loadFont(
      join(process.cwd(), "public/fonts/Nunito-SemiBold.ttf")
    );

    imageOptions = {
      width: 1200,
      height: 800,
      fonts: [
        {
          name: "Nunito",
          data: regularFont,
          weight: 400,
          style: "normal",
        },
        {
          name: "Nunito",
          data: semiBoldFont,
          weight: 600,
          style: "normal",
        },
      ],
    };

    return imageOptions;
  } catch (error) {
    throw error;
  }
}

export default async function Image() {
  const options = await initializeFonts();
  
  // Use static gradient values
  const BACKGROUND_GRADIENT_STYLE = {
    backgroundImage: "linear-gradient(to bottom, #c026d3, #ef4444)",
    color: "white",
  };
  /*
this Image is rendered using vercel/satori.

Satori supports a limited subset of HTML and CSS features, due to its special use cases. In general, only these static and visible elements and properties that are implemented.
For example, the <input> HTML element, the cursor CSS property are not in consideration. And you can't use <style> tags or external resources via <link> or <script>.
Also, Satori does not guarantee that the SVG will 100% match the browser-rendered HTML output since Satori implements its own layout engine based on the SVG 1.1 spec.
Please refer to Satori’s documentation for a list of supported HTML and CSS features. https://github.com/vercel/satori#css
*/
  return new ImageResponse(
    (
      <div
        tw="h-full w-full flex flex-col justify-center items-center relative"
        style={BACKGROUND_GRADIENT_STYLE}
      >
        <h1 tw="text-9xl text-center font-semibold">{PROJECT_TITLE}</h1>
        <h3 tw="text-4xl font-normal">{PROJECT_DESCRIPTION}</h3>
      </div>
    ),
    options
  );
}
