import zipfile
import xml.etree.ElementTree as ET
import sys

def extract_text(docx_path):
    with zipfile.ZipFile(docx_path) as docx:
        xml_content = docx.read('word/document.xml')
    
    tree = ET.fromstring(xml_content)
    namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    
    paragraphs = []
    for p in tree.iterfind('.//w:p', namespaces):
        texts = [node.text for node in p.iterfind('.//w:t', namespaces) if node.text]
        if texts:
            paragraphs.append(''.join(texts))
            
    return '\n'.join(paragraphs)

if __name__ == '__main__':
    text = extract_text(sys.argv[1])
    with open(sys.argv[2], 'w', encoding='utf-8') as f:
        f.write(text)
