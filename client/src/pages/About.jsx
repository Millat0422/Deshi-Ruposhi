import { Link } from 'react-router-dom';
import WhyOrixa from '../components/home/WhyOrixa';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function About() {
  useDocumentTitle('About');
  return (
    <>
      <section className="about-hero">
        <div className="container about-hero__inner">
          <p className="eyebrow">About ORiXA</p>
          <h1>Clothes that carry your story</h1>
          <p>
            ORiXA started with a simple idea: the pieces you wear most should be the best made. We design modern essentials in premium fabrics, cut for all-day comfort and
            finished with care — so they become part of your everyday story.
          </p>
          <Link to="/shop" className="btn btn--primary btn--lg">
            Explore the collection
          </Link>
        </div>
      </section>
      <section className="section container prose-grid">
        <div>
          <h2>Considered materials</h2>
          <p>We choose heavyweight combed cotton, brushed fleece and durable twills for their handfeel and longevity, and pre-wash our garments to minimise shrinkage.</p>
        </div>
        <div>
          <h2>Timeless design</h2>
          <p>Neutral colours, clean lines and relaxed fits that layer easily. Our pieces are designed to be mixed, matched and worn season after season.</p>
        </div>
        <div>
          <h2>Honest shopping</h2>
          <p>Transparent prices, clear shipping costs and cash on delivery. What you see at checkout is exactly what you pay.</p>
        </div>
      </section>
      <WhyOrixa />
    </>
  );
}
