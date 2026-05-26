import React from 'react';

const ContactPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in-up">
      <div className="max-w-md w-full space-y-8 text-center bg-transparent p-10 rounded-2xl shadow-2xl border border-black/10 dark:border-white/10">
        <div>
          <h2 className="mt-6 text-center text-4xl font-extrabold text-black dark:text-white">
            Connect with Us
          </h2>
          <p className="mt-4 text-center text-lg text-black/70 dark:text-white/70">
            We'd love to hear from you! Whether you have a question, feedback, or need assistance, feel free to reach out.
          </p>
        </div>
        <div className="mt-8">
          <a
            href="mailto:teamcodehustlers@gmail.com"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
          >
            Email Us at teamcodehustlers@gmail.com
          </a>
        </div>
        <p className="mt-6 text-xs text-black/60 dark:text-white/60">
          Our team will get back to you as soon as possible.
        </p>
      </div>
    </div>
  );
};

export default ContactPage;