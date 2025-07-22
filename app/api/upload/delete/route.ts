import { NextRequest, NextResponse } from "next/server";
import { deleteFromPinata } from "@/utils/pinata";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cid } = body;

    if (!cid) {
      return NextResponse.json({ success: false, message: "No CID provided" }, { status: 400 });
    }

    console.log(`Attempting to delete file with CID: ${cid} from Pinata`);
    
    // Delete from Pinata
    const result = await deleteFromPinata(cid);

    if (!result.success) {
      console.error(`Failed to delete file with CID: ${cid}`, result.error);
      throw new Error(result.error || "Unknown error occurred during Pinata deletion");
    }

    console.log(`Successfully deleted file with CID: ${cid} from Pinata`);
    
    return NextResponse.json({
      success: true,
      message: "File deleted successfully from Pinata"
    });
  } catch (error) {
    console.error("Error deleting from Pinata:", error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    }, { status: 500 });
  }
} 