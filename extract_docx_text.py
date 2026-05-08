from pathlib import Path
from zipfile import ZipFile
import re

def main():
    p = Path('AutoEase_Assignment3_Report.docx')
    if not p.exists():
        raise FileNotFoundError(p)
    with ZipFile(p, 'r') as z:
        xml = z.read('word/document.xml').decode('utf-8')
    text = re.sub(r'<(/?w:t[^>]*)>', '', xml)
    text = re.sub(r'<[^>]+>', '', text)
    print(text)

if __name__ == '__main__':
    main()
