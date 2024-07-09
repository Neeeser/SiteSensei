import fs from 'fs/promises';
import path from 'path';
import DynamicContent from '../../components/DynamicContent';

export default async function DynamicPage({ params }) {
  const { page } = params;
  const filePath = path.join(process.cwd(), 'content', `${page}.json`);

  let content;
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    content = JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading file:', error);
    content = { html: '<p>Content not found</p>', javascript: '' };
  }

  return (
    <div className="page-container">
      <DynamicContent 
        html={content.combined || content.html} 
        javascript={content.combined ? undefined : content.javascript} 
      />
    </div>
  );
}

export async function generateStaticParams() {
  const contentDir = path.join(process.cwd(), 'content');
  const files = await fs.readdir(contentDir);
  return files.map(file => ({
    page: file.replace('.json', ''),
  }));
}
