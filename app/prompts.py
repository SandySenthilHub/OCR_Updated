# prompts.py

SIGNATURE_STAMP_PROMPT = """
Analyze this document page image carefully for any stamps, signatures, seals, or handwritten marks.
Describe:
- Whether a signature or stamp is present
- Location (top, bottom, left, right, center)
- Any readable text inside the stamp/signature
- Confidence (high/medium/low)
If none found, say "No signature or stamp detected."
"""
DOCUMENT_TYPE_VISION_PROMPT = """
You are an expert in trade, banking, and insurance documents.

Based ONLY on the visual layout, title, logos, stamps, and structure of the page:
Identify the document type.

Choose ONLY ONE from this list:
{types}

If unsure, return exactly:
unknown

Return ONLY the document CODE (no explanation).
"""

CLASSIFICATION_PROMPT_TEMPLATE = """
You are a senior international trade documentation specialist.

Your task:
Classify the given page into EXACTLY ONE document type from the list below.

Available document types (authoritative master list):
{types_descriptions}

CRITICAL DISAMBIGUATION RULES (FOLLOW STRICTLY):

1. The word "certificate" alone is NOT sufficient to classify.
2. Determine the document PURPOSE, not the title.

Purpose-based classification rules:
- If content refers to country of origin, origin criteria, exporter country → Certificate of Origin
- If content refers to net/gross weight, measurements, weight declaration → Weight List or Certificate of Weight
- If content refers to compliance, conformity, standards, declarations → Certificate of Compliance
- If content refers to invoice,goods, price, amount, total value → Commercial Invoice
- If content refers to packing, cartons, dimensions → Packing List
- If content refers to vessel, shipment, ports, consignee → Bill of Lading

Additional rules:
- Prefer the CLOSEST MATCH from the list.
- Use 'unknown' ONLY if no document type reasonably applies.
- Ignore company letterheads and addresses.
- Repeated pages of the same document must return the SAME code.

Output format (STRICT):
Return exactly ONE line:
CODE|DOCUMENT_NAME

Examples:
INV|commercial_invoice
PL|packing_list
BL|bill_of_lading
CoO|certificate_of_origin
unknown|unknown

Document page content:
{content}

Answer:
"""


EXTERNAL_DOC_INFERENCE_PROMPT = """
You are an expert in trade, banking, insurance, and commercial documentation.

Based ONLY on the content below:
1. Identify what type of document this most likely is
2. Respond with a SHORT document name (max 5 words)
3. Do NOT invent codes
4. Do NOT add explanations

Examples:
- "Insurance Policy"
- "Bank Advice"
- "Delivery Note"
- "Customer Application Form"

Document content:
{content}

Output only the document name:
"""
