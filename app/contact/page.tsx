'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'お問い合わせの送信に失敗しました');
      }

      console.log('Contact form submitted successfully:', result);
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      const errorMsg = error instanceof Error ? error.message : 'お問い合わせの送信に失敗しました';
      setErrorMessage(errorMsg);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      maxWidth: '700px',
      margin: '0 auto',
      padding: '2rem 1rem',
      backgroundColor: 'white',
      minHeight: 'calc(100vh - 64px)'
    }}>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '2rem',
        color: '#2d5016',
        borderBottom: '2px solid #2d5016',
        paddingBottom: '0.5rem'
      }}>
        お問い合わせ
      </h1>

      <p style={{
        marginBottom: '2rem',
        lineHeight: '1.8',
        color: '#555'
      }}>
        林道マップに関するご質問、ご意見、ご要望などがございましたら、以下のフォームよりお気軽にお問い合わせください。
      </p>

      {submitStatus === 'success' && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          marginBottom: '1.5rem',
          color: '#155724'
        }}>
          お問い合わせを受け付けました。ご連絡ありがとうございます。
        </div>
      )}

      {submitStatus === 'error' && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '1.5rem',
          color: '#721c24'
        }}>
          {errorMessage || '送信中にエラーが発生しました。もう一度お試しください。'}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="name"
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#333'
            }}
          >
            お名前 <span style={{ color: '#d32f2f' }}>*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#333'
            }}
          >
            メールアドレス <span style={{ color: '#d32f2f' }}>*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="subject"
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#333'
            }}
          >
            件名 <span style={{ color: '#d32f2f' }}>*</span>
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="message"
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#333'
            }}
          >
            お問い合わせ内容 <span style={{ color: '#d32f2f' }}>*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={8}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          marginTop: '2rem'
        }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: isSubmitting ? '#ccc' : '#2d5016',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: '500',
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {isSubmitting ? '送信中...' : '送信する'}
          </button>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              backgroundColor: '#666',
              color: 'white',
              textDecoration: 'none',
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: '500',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
          >
            キャンセル
          </Link>
        </div>
      </form>

      <div style={{
        marginTop: '3rem',
        padding: '1.5rem',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        fontSize: '0.9rem',
        color: '#666',
        lineHeight: '1.8'
      }}>
        <p style={{ marginBottom: '0.5rem' }}>
          <strong>注意事項：</strong>
        </p>
        <ul style={{ marginLeft: '1.5rem', listStyleType: 'disc' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            お問い合わせ内容によっては、回答までにお時間をいただく場合がございます。
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            メールアドレスの入力間違いにご注意ください。
          </li>
          <li>
            個人情報の取り扱いについては、
            <Link href="/privacy-policy" style={{ color: '#2d5016', textDecoration: 'underline' }}>
              プライバシーポリシー
            </Link>
            をご確認ください。
          </li>
        </ul>
      </div>
    </div>
  );
}
