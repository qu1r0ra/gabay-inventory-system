import { Document } from '../lib/pdf';
import Button from '../components/Button'
import { useRef, useState } from 'react';

function GenerateReport() {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const generatePDF = async () => {
    // PDF Creation
    console.log('creating pdf')
    setIsCreated(false);
    setIsCreating(true);
    const doc = await Document.new('Gabay Summary Report');
    doc
      .beginPage()
        .header('Hello World', { size: 1 })
        .text('Creating PDFs in JavaScript is awesome!')
        .text('Here\'s some more text, pretend this is some cool stuff.')
        .header('Subheader', { size: 3 })
        .endPage()
      .beginPage()
        .header('Next Page', { size: 1, alignment: 'center' })
        .text('The title above should be center aligned.')
        .endPage()
      .beginPage()
        .header('Last Page', { size: 1, alignment: 'right' })
        .header('With some cool subtext', { size: 3, alignment: 'right' })
        .text('The title above should be right aligned.')
        .endPage();

    const url = await doc.save();
    linkRef.current?.setAttribute('href', url);
    linkRef.current?.setAttribute('download', 'report summary');

    console.log(url)

    console.log('pdf created')
    setIsCreated(true);
    setIsCreating(false);
  }

  return (
    <>
      <p>GenerateReport</p>
      <Button onClick={() => generatePDF()}>
        Create PDF
      </Button>
      {/* {isCreated && <a ref={linkRef}> 
        <Button disabled={isCreating} className='w-full'>
          {isCreating ? "Generating Report..." : "Download PDF here"}
        </Button>
      </a>} */}
    </>
  );
}

export default GenerateReport;
