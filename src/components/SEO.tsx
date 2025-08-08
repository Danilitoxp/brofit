import { Helmet, HelmetProvider } from 'react-helmet-async';
import type { FC } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonicalPath?: string;
}

export const SEO: FC<SEOProps> = ({ title, description, canonicalPath }) => {
  const canonicalUrl = canonicalPath ? `${window.location.origin}${canonicalPath}` : undefined;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    </Helmet>
  );
};

export { HelmetProvider };
