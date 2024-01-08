import withWaymarkModal from 'shared/components/WithWaymarkModal';

import * as styles from './ShutterstockTermsModal.css';

/**
 * Modal displays shutterstock's terms of service
 */
const ShutterstockTermsModalContents = () => (
  <div className={styles.TermsModalContents}>
    <h2>Terms of Use</h2>
    <p>Content is for digital use within Waymark only and may not be used for printing.</p>
    <p>You may not use the content as a trademark for a business.</p>
    <p>
      You may not portray a person in a way that may be offensive, including: in connection with
      adult-oriented services or ads for dating services; in connection with the promotion of
      tobacco products; in connection with political endorsements; with pornographic, defamatory,
      unlawful, offensive or immoral content; and as suffering from, or being treated for, a
      physical or mental ailment.
    </p>
    <p>
      You may only use the content in campaigns and content created on Waymark, and not with other
      website or content services.
    </p>
  </div>
);

export const ShutterstockTermsModal = withWaymarkModal()(ShutterstockTermsModalContents);
