import { Banknote, Check, ChevronLeft, CreditCard, Lock, ShoppingBag } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AddressForm from '../components/common/AddressForm';
import ProductImage from '../components/common/ProductImage';
import Spinner from '../components/common/Spinner';
import { EmptyState, InlineAlert } from '../components/common/States';
import OrderSummary from '../components/product/OrderSummary';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { orderService } from '../services/orderService';
import { formatPrice } from '../utils/format';

const STEPS = ['Shipping', 'Review', 'Payment'];
const PAYMENT_ICONS = { cod: Banknote, stripe: CreditCard, sslcommerz: CreditCard };
const toPayloadItems = (items) => items.map(({ productId, quantity, size, color }) => ({ product: productId, quantity, size, color }));

function Stepper({ step }) {
  return (
    <ol className="stepper" aria-label="Checkout progress">
      {STEPS.map((label, index) => {
        const state = index < step ? 'done' : index === step ? 'current' : 'todo';
        return (
          <li key={label} className={`stepper__step is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="stepper__dot">{state === 'done' ? <Check size={14} /> : index + 1}</span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function Checkout() {
  useDocumentTitle('Checkout');
  const { user } = useAuth();
  const { items, totals: estimate, clearCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const savedAddresses = user?.addresses || [];
  const defaultAddress = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

  const [step, setStep] = useState(0);
  const [addressMode, setAddressMode] = useState(defaultAddress ? defaultAddress._id : 'new');
  const [shippingAddress, setShippingAddress] = useState(null);
  const [saveAddress, setSaveAddress] = useState(savedAddresses.length === 0);
  const [couponInput, setCouponInput] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoting, setQuoting] = useState(false);
  const [config, setConfig] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState('');

  useEffect(() => {
    orderService.config().then(setConfig).catch(() => setConfig({ paymentMethods: [{ id: 'cod', label: 'Cash on Delivery', enabled: true }] }));
  }, []);

  // Ask the server for authoritative totals whenever the cart or coupon changes.
  const itemsSignature = items.map((i) => `${i.key}:${i.quantity}`).join(',');
  const fetchQuote = useCallback(
    async (code) => {
      if (items.length === 0) return;
      setQuoting(true);
      setQuoteError('');
      try {
        setQuote(await orderService.quote({ items: toPayloadItems(items), couponCode: code || undefined }));
        return true;
      } catch (error) {
        setQuoteError(error.message);
        return false;
      } finally {
        setQuoting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemsSignature]
  );

  useEffect(() => {
    fetchQuote(couponCode);
  }, [fetchQuote, couponCode]);

  if (items.length === 0 && !placing) {
    return (
      <div className="container section">
        <EmptyState icon={ShoppingBag} title="Your bag is empty" message="Add a few pieces before checking out." actionLabel="Shop now" actionTo="/shop" />
      </div>
    );
  }

  const useSavedAddress = () => {
    const saved = savedAddresses.find((a) => a._id === addressMode);
    if (!saved) return;
    const { fullName, phone, address, city, state, postalCode, country } = saved;
    setShippingAddress({ fullName, phone, address, city, state, postalCode, country });
    setSaveAddress(false);
    setStep(1);
  };

  const applyCoupon = async (event) => {
    event.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponError('');
    setQuoting(true);
    try {
      setQuote(await orderService.quote({ items: toPayloadItems(items), couponCode: code }));
      setCouponCode(code);
      toast.success(`Coupon ${code} applied`);
    } catch (error) {
      setCouponError(error.message);
    } finally {
      setQuoting(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponInput('');
  };

  const placeOrder = async () => {
    setPlacing(true);
    setPlaceError('');
    try {
      const { order } = await orderService.create({
        items: toPayloadItems(items),
        shippingAddress,
        paymentMethod,
        couponCode: couponCode || undefined,
        notes: notes.trim() || undefined,
        saveAddress,
      });
      clearCart();
      navigate(`/orders/${order._id}?placed=1`, { replace: true });
    } catch (error) {
      setPlaceError(error.message);
      setPlacing(false);
    }
  };

  const totals = quote || { subtotal: estimate.subtotal, shippingCost: estimate.shipping, tax: estimate.tax, discount: 0, total: estimate.total };

  return (
    <div className="container checkout">
      <header className="page-header page-header--row">
        <h1>Checkout</h1>
        <span className="muted small inline-icon">
          <Lock size={14} aria-hidden="true" /> Secure checkout
        </span>
      </header>
      <Stepper step={step} />

      <div className="checkout__grid">
        <section className="card checkout__main">
          {step === 0 && (
            <>
              <h2>Shipping address</h2>
              {savedAddresses.length > 0 && (
                <fieldset className="address-choices">
                  <legend className="visually-hidden">Choose a saved address</legend>
                  {savedAddresses.map((a) => (
                    <label key={a._id} className={`choice ${addressMode === a._id ? 'is-active' : ''}`}>
                      <input type="radio" name="address" value={a._id} checked={addressMode === a._id} onChange={() => setAddressMode(a._id)} />
                      <span>
                        <strong>
                          {a.label} — {a.fullName}
                        </strong>
                        <small>
                          {a.address}, {a.city}, {a.state} {a.postalCode}, {a.country} · {a.phone}
                        </small>
                      </span>
                    </label>
                  ))}
                  <label className={`choice ${addressMode === 'new' ? 'is-active' : ''}`}>
                    <input type="radio" name="address" value="new" checked={addressMode === 'new'} onChange={() => setAddressMode('new')} />
                    <span>
                      <strong>Use a new address</strong>
                    </span>
                  </label>
                </fieldset>
              )}

              {addressMode === 'new' ? (
                <AddressForm
                  initial={{ fullName: user.name, ...(shippingAddress || {}) }}
                  onSubmit={async (address) => {
                    setShippingAddress(address);
                    setStep(1);
                  }}
                  submitLabel="Continue to review"
                >
                  <label className="check">
                    <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                    <span>Save this address to my account</span>
                  </label>
                </AddressForm>
              ) : (
                <button type="button" className="btn btn--primary btn--lg" onClick={useSavedAddress}>
                  Continue to review
                </button>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <div className="panel-head">
                <h2>Review your order</h2>
                <button type="button" className="link-btn" onClick={() => setStep(0)}>
                  <ChevronLeft size={16} aria-hidden="true" /> Edit address
                </button>
              </div>
              <div className="review-address">
                <p className="eyebrow">Shipping to</p>
                <p>
                  <strong>{shippingAddress.fullName}</strong> · {shippingAddress.phone}
                </p>
                <p className="muted">
                  {shippingAddress.address}, {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}, {shippingAddress.country}
                </p>
              </div>
              <ul className="review-items">
                {(quote?.items || []).map((item) => (
                  <li key={`${item.product}-${item.size}-${item.color}`}>
                    <ProductImage src={item.image} alt={item.name} />
                    <span className="review-items__info">
                      <strong>{item.name}</strong>
                      <small>
                        {[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(' · ')} · Qty {item.quantity} × {formatPrice(item.price)}
                      </small>
                    </span>
                    <span>{formatPrice(item.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              {quoteError && (
                <InlineAlert>
                  {quoteError} <Link to="/cart">Review your bag</Link>
                </InlineAlert>
              )}
              <button type="button" className="btn btn--primary btn--lg" onClick={() => setStep(2)} disabled={!quote || quoting || Boolean(quoteError)}>
                Continue to payment
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="panel-head">
                <h2>Payment method</h2>
                <button type="button" className="link-btn" onClick={() => setStep(1)}>
                  <ChevronLeft size={16} aria-hidden="true" /> Back to review
                </button>
              </div>
              <fieldset className="payment-methods">
                <legend className="visually-hidden">Payment method</legend>
                {(config?.paymentMethods || []).map((method) => {
                  const Icon = PAYMENT_ICONS[method.id] || CreditCard;
                  return (
                    <label key={method.id} className={`choice ${paymentMethod === method.id ? 'is-active' : ''} ${method.enabled ? '' : 'is-disabled'}`}>
                      <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} disabled={!method.enabled} onChange={() => setPaymentMethod(method.id)} />
                      <Icon size={20} aria-hidden="true" />
                      <span>
                        <strong>{method.label}</strong>
                        <small>{method.enabled ? method.description : 'Coming soon'}</small>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
              <label className="field">
                <span className="field__label">Order notes (optional)</span>
                <textarea rows={3} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery instructions, landmark…" />
              </label>
              <InlineAlert>{placeError}</InlineAlert>
              <button type="button" className="btn btn--primary btn--lg btn--block" onClick={placeOrder} disabled={placing || quoting || !quote || Boolean(quoteError)}>
                {placing ? 'Placing order…' : `Place order · ${formatPrice(totals.total)}`}
              </button>
              <p className="muted small center">You will pay {formatPrice(totals.total)} in cash when your order is delivered.</p>
            </>
          )}
        </section>

        <aside className="card checkout__summary" aria-label="Order summary">
          <h2>Summary</h2>
          <ul className="mini-items">
            {items.map((item) => (
              <li key={item.key}>
                <span className="mini-items__img">
                  <ProductImage src={item.image} alt="" />
                  <span className="mini-items__qty">{item.quantity}</span>
                </span>
                <span className="mini-items__name">
                  {item.name}
                  <small>{[item.size, item.color].filter(Boolean).join(' · ')}</small>
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          {couponCode ? (
            <div className="coupon coupon--applied">
              <span>
                Coupon <strong>{couponCode}</strong> applied
              </span>
              <button type="button" className="link-btn" onClick={removeCoupon}>
                Remove
              </button>
            </div>
          ) : (
            <form className="coupon" onSubmit={applyCoupon}>
              <label htmlFor="coupon" className="visually-hidden">
                Coupon code
              </label>
              <input id="coupon" placeholder="Coupon code" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} maxLength={30} />
              <button type="submit" className="btn btn--outline btn--sm" disabled={!couponInput.trim() || quoting}>
                Apply
              </button>
              {couponError && (
                <p className="field__error coupon__error" role="alert">
                  {couponError}
                </p>
              )}
            </form>
          )}

          <div className="checkout__totals">
            {quoting && <Spinner size="sm" label="Updating totals" />}
            <OrderSummary subtotal={totals.subtotal} shipping={totals.shippingCost} discount={totals.discount} tax={totals.tax} total={totals.total} couponCode={couponCode} />
          </div>
          {quoteError && step !== 1 && <InlineAlert>{quoteError}</InlineAlert>}
        </aside>
      </div>
    </div>
  );
}
