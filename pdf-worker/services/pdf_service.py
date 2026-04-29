"""MinerU (magic-pdf) PDF → Markdown conversion."""
import os
import tempfile
from pathlib import Path


def pdf_to_markdown(pdf_bytes: bytes) -> str:
    """
    Convert PDF bytes to Markdown string using MinerU (magic-pdf).
    Uses the Python API to avoid subprocess overhead.
    """
    from magic_pdf.data.data_reader_writer import FileBasedDataWriter, FileBasedDataReader
    from magic_pdf.data.dataset import PymuDocDataset
    from magic_pdf.model.doc_analyze_by_custom_model import doc_analyze
    from magic_pdf.config.enums import SupportedPdfParseMethod

    with tempfile.TemporaryDirectory() as tmpdir:
        pdf_path = os.path.join(tmpdir, "input.pdf")
        output_dir = os.path.join(tmpdir, "output")
        os.makedirs(output_dir, exist_ok=True)

        Path(pdf_path).write_bytes(pdf_bytes)

        reader = FileBasedDataReader("")
        pdf_data = reader.read(pdf_path)

        ds = PymuDocDataset(pdf_data)

        if ds.classify() == SupportedPdfParseMethod.OCR:
            infer_result = ds.apply(doc_analyze, ocr=True)
            pipe = infer_result.pipe_ocr_mode(FileBasedDataWriter(output_dir))
        else:
            infer_result = ds.apply(doc_analyze, ocr=False)
            pipe = infer_result.pipe_txt_mode(FileBasedDataWriter(output_dir))

        md_content = pipe.get_markdown(output_dir)
        return md_content
