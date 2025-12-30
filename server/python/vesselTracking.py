import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import traceback


app = FastAPI(title="Vessel Tracking Proxy API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


MARINESIA_API_KEY = "fctJUiIEiHmdbaEkTRIQCODCJ"
BASE_URL = "https://api.marinesia.com/api/v1/vessel"



@app.get("/")
async def root():
    return {"message": "Vessel Tracking Proxy API is running"}



@app.get("/vessel/{mmsi}")
async def get_vessel(mmsi: str):
    """
    Fetch latest vessel position and metadata from Marinesia API.
    This acts as a backend proxy to bypass frontend CORS restrictions.
    """
    try:
        url = f"{BASE_URL}/{mmsi}/location/latest"
        headers = {"x-api-key": MARINESIA_API_KEY}
        print(f" Fetching vessel data for {mmsi}: {url}")

        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, headers=headers)
            print(f"Marinesia Status: {response.status_code}")

            #  Custom handling for known cases
            if response.status_code == 404:
                raise HTTPException(
                    status_code=404,
                    detail=f"Vessel with MMSI {mmsi} not found or not active/live.",
                )
            elif response.status_code == 403:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: Invalid or expired API key.",
                )
            elif response.status_code >= 500:
                raise HTTPException(
                    status_code=502,
                    detail="Marinesia server error. Please try again later.",
                )

            try:
                data = response.json()
                print(f"Received data for {mmsi}: {data}")
                return data
            except Exception:
                raise HTTPException(
                    status_code=500,
                    detail="Error parsing response from Marinesia API.",
                )

    except httpx.RequestError as e:
        print(f" Network error: {e}")
        raise HTTPException(status_code=500, detail="Unable to reach Marinesia API.")

    except HTTPException:
        raise

    # Handle anything unexpected
    except Exception as e:
        print(" Unexpected error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching vessel data: {e}")


        
# ----------------------------------
#  Run Command (if using directly)
# ----------------------------------
# Run this app using: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("vesselTracking:app", host="0.0.0.0", port=8000, reload=True)
