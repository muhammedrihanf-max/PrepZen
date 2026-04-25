import React, { useState } from 'react';
import { X, Plus, Save, Trash2, Image as ImageIcon, Sigma, List, Bold } from 'lucide-react';
import MathText from './MathText';

export interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  imageUrl?: string;
  points: number;
}

interface QuestionFormProps {
  onSave: (questions: Question[], subject: string, grade: string) => void;
  onCancel: () => void;
  initialQuestions?: Question[];
  examYear?: string;
  initialSubject?: string;
  initialGrade?: string;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ 
  onSave, onCancel, initialQuestions = [], examYear = '2024', 
  initialSubject = 'Mathematics', initialGrade = 'Grade 12' 
}) => {
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions.length > 0 ? initialQuestions : [{ text: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', points: 5 }]
  );
  const [headline, setHeadline] = useState(`Manage Questions - ${examYear} Exam`);
  const [subject, setSubject] = useState(initialSubject);
  const [grade, setGrade] = useState(initialGrade);

  const cleanText = (text: string): string => {
    // Automatically replace \cdot with a space as per user preference
    return text.replace(/\\cdot/g, ' ');
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', points: 5 }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const newQuestions = [...questions];
    let finalValue = value;
    
    // Clean text fields
    if (typeof value === 'string' && (field === 'text' || field === 'explanation')) {
      finalValue = cleanText(value);
    }
    
    newQuestions[index] = { ...newQuestions[index], [field]: finalValue } as Question;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = cleanText(value);
    setQuestions(newQuestions);
  };
  
  const addOptionToQuestion = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push('');
    setQuestions(newQuestions);
  };
  
  const removeOptionFromQuestion = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    const q = newQuestions[qIndex];
    if (q.options.length <= 2) return; // Minimum 2 options
    
    q.options.splice(oIndex, 1);
    
    // Adjust correct answer if needed
    if (q.correctAnswer === oIndex) {
      q.correctAnswer = 0; // Reset if the correct one was deleted
    } else if (q.correctAnswer > oIndex) {
      q.correctAnswer -= 1; // Shift back if an earlier option was deleted
    }
    
    setQuestions(newQuestions);
  };

  const insertFormatting = (qIndex: number, field: 'text' | 'explanation', type: 'bullet' | 'bold' | 'math' | 'image') => {
    const newQuestions = [...questions];
    const q = { ...newQuestions[qIndex] };
    let currentValue = q[field] as string;
    
    switch (type) {
      case 'bullet': {
        const prefix = currentValue.length > 0 && !currentValue.endsWith('\n') ? '\n* ' : '* ';
        currentValue += prefix;
        break;
      }
      case 'bold':
        currentValue += ' **Bold Text** ';
        break;
      case 'math':
        currentValue += ' $E=mc^2$ ';
        break;
      case 'image':
        // Trigger the file input programmatically
        document.getElementById(`q-image-upload-${qIndex}`)?.click();
        return; // Don't update text directly
    }

    q[field] = currentValue;
    newQuestions[qIndex] = q;
    setQuestions(newQuestions);
  };

  const handleImageUpload = (index: number, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateQuestion(index, 'imageUrl', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (index: number, e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        handleImageUpload(index, file);
      }
    }
  };

  return (
    <div className="question-form-overlay">
      <div className="question-form-container glass-card">
        <header className="form-header">
          <input 
            className="headline-input"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            title="Click to edit headline"
          />
          <div className="header-controls">
            <div className="meta-selectors">
              <select 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                className="meta-select"
                title="Select Subject"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="English">English</option>
                <option value="Computer Science">Computer Science</option>
              </select>
              <select 
                value={grade} 
                onChange={(e) => setGrade(e.target.value)}
                className="meta-select"
                title="Select Grade"
              >
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
                <option value="University Foundation">University Foundation</option>
              </select>
            </div>
            <button onClick={onCancel} className="btn-icon-glass" aria-label="Close form"><X size={20} /></button>
          </div>
        </header>

        <div className="questions-list">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="question-item premium-card">
              <div className="question-item-header">
                <h3>Question {qIndex + 1}</h3>
                <button onClick={() => removeQuestion(qIndex)} className="text-error icon-btn" aria-label="Remove question"><Trash2 size={20} /></button>
              </div>

               <div className="input-group">
                <div className="label-with-toolbar">
                  <label>Question Text</label>
                  <div className="formatting-toolbar">
                    <button type="button" onClick={() => insertFormatting(qIndex, 'text', 'bullet')} title="Insert Bullet"><List size={14} /></button>
                    <button type="button" onClick={() => insertFormatting(qIndex, 'text', 'bold')} title="Format Bold"><Bold size={14} /></button>
                    <button type="button" onClick={() => insertFormatting(qIndex, 'text', 'math')} title="Insert Math"><Sigma size={14} /></button>
                    <button type="button" onClick={() => insertFormatting(qIndex, 'text', 'image')} title="Attach Image"><ImageIcon size={14} /></button>
                  </div>
                </div>
                <textarea 
                  value={q.text} 
                  onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                  onPaste={(e) => handlePaste(qIndex, e)}
                  placeholder="Enter the question here... (Use $...$ for math, e.g. $E=mc^2$)"
                />
                {q.imageUrl && (
                  <div className="question-image-preview">
                    <img src={q.imageUrl} alt="Question figure" />
                    <button className="remove-image-pill" onClick={() => updateQuestion(qIndex, 'imageUrl', '')}>
                      <X size={12} /> Remove Image
                    </button>
                  </div>
                )}
                {q.text.includes('$') && (
                  <div className="math-preview-box">
                    <div className="preview-label"><Sigma size={12} /> Math Preview</div>
                    <MathText text={q.text} />
                  </div>
                )}
              </div>

               <div className="input-group">
                <div className="label-with-toolbar">
                  <label>Explanation Text</label>
                  <div className="formatting-toolbar">
                    <button type="button" onClick={() => insertFormatting(qIndex, 'explanation', 'bullet')} title="Insert Bullet"><List size={14} /></button>
                    <button type="button" onClick={() => insertFormatting(qIndex, 'explanation', 'bold')} title="Format Bold"><Bold size={14} /></button>
                    <button type="button" onClick={() => insertFormatting(qIndex, 'explanation', 'math')} title="Insert Math"><Sigma size={14} /></button>
                  </div>
                </div>
                <textarea 
                  value={q.explanation} 
                  onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                  onPaste={(e) => handlePaste(qIndex, e)}
                  placeholder="Explain why this answer is correct... (Tip: You can use $...$ for equations!)"
                />
                {q.explanation.includes('$') && (
                  <div className="math-preview-box">
                    <div className="preview-label"><Sigma size={12} /> Math Preview</div>
                    <MathText text={q.explanation} />
                  </div>
                )}
              </div>

              <div className="input-group">
                <label>Question Image / Diagram (Optional)</label>
                <div className="image-upload-area">
                  <input 
                    type="file" 
                    id={`q-image-upload-${qIndex}`}
                    accept="image/*"
                    className="hidden-file-input"
                    onChange={(e) => handleImageUpload(qIndex, e.target.files?.[0] || null)}
                  />
                  {!q.imageUrl && (
                    <label htmlFor={`q-image-upload-${qIndex}`} className="upload-placeholder-compact">
                      <ImageIcon size={20} />
                      <span>Click to upload image or paste directly into text area</span>
                    </label>
                  )}
                </div>
              </div>

               <div className="options-input-grid">
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="input-group-option-wrapper">
                    <div className="input-group">
                      <label>Option {String.fromCharCode(65 + oIndex)}</label>
                      <div className="option-input-container">
                        <input 
                          type="text" 
                          value={opt}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                        />
                        {q.options.length > 2 && (
                          <button 
                            className="btn-option-delete" 
                            onClick={() => removeOptionFromQuestion(qIndex, oIndex)}
                            title="Delete option"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      {opt.includes('$') && (
                        <div className="math-preview-box mini">
                          <MathText text={opt} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="add-option-container">
                  <button 
                    className="btn-add-option-glass" 
                    onClick={() => addOptionToQuestion(qIndex)}
                    type="button"
                  >
                    <Plus size={16} />
                    <span>Add Choice</span>
                  </button>
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Correct Answer</label>
                  <select 
                    aria-label="Select correct answer"
                    value={q.correctAnswer} 
                    onChange={(e) => updateQuestion(qIndex, 'correctAnswer', parseInt(e.target.value))}
                  >
                    {q.options.map((_, oIndex) => (
                      <option key={oIndex} value={oIndex}>Option {String.fromCharCode(65 + oIndex)}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Points</label>
                  <input 
                    type="number" 
                    aria-label="Points for this question"
                    value={q.points} 
                    onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="form-footer">
          <button className="btn-glass-primary" onClick={addQuestion}>
            <Plus size={20} />
            <span>Add Question</span>
          </button>
          <button className="btn-primary" onClick={() => onSave(questions, subject, grade)}>
            <Save size={20} />
            <span>Save Exam</span>
          </button>
        </footer>
      </div>

      <style>{`
        .question-form-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--spacing-lg);
          overflow-y: auto; /* Fallback for small screens */
        }
        .question-form-container {
          width: 100%;
          max-width: 900px;
          height: 90vh;
          display: flex;
          flex-direction: column;
          background: rgba(15, 12, 41, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-xl);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          overflow: hidden;
        }
        .form-header {
          padding: var(--spacing-lg) var(--spacing-xl);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.03);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--spacing-md);
        }
        .headline-input {
          background: transparent !important;
          border: none !important;
          font-size: 1.5rem !important;
          font-weight: 800 !important;
          padding: 4px 0 !important;
          margin: 0 !important;
          flex: 1 !important;
          color: #a78bfa !important;
          cursor: text;
        }
        .headline-input:focus {
          box-shadow: none !important;
          outline: none !important;
          opacity: 0.8;
        }
        .questions-list {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
          padding: var(--spacing-xl);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
          -webkit-overflow-scrolling: touch;
        }
        .questions-list::-webkit-scrollbar {
          width: 8px;
        }
        .questions-list::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .questions-list::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.4);
          border-radius: 10px;
          border: 2px solid rgba(15, 12, 41, 0.95);
        }
        .question-item {
          flex-shrink: 0;
          padding: var(--spacing-xl);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-lg);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .question-item:hover {
          border-color: rgba(99, 102, 241, 0.3);
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.05);
        }
        .question-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }
        .question-item-header h3 {
          color: #a78bfa;
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: var(--spacing-lg);
        }
        .input-group label {
          font-weight: 700;
          color: #818cf8;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          opacity: 0.9;
        }
        .options-input-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
          margin-top: var(--spacing-sm);
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }
        .form-footer {
          padding: var(--spacing-lg) var(--spacing-xl);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: center;
          gap: var(--spacing-md);
          background: rgba(255, 255, 255, 0.03);
          flex-shrink: 0;
          z-index: 10;
        }
        textarea, input, select {
          background: rgba(0, 0, 0, 0.2) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          padding: 14px !important;
          color: white !important;
          font-size: 0.95rem !important;
          transition: all 0.3s ease !important;
        }
        textarea:focus, input:focus, select:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.2) !important;
          outline: none !important;
          background: rgba(0, 0, 0, 0.3) !important;
        }
        .header-controls {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        .meta-selectors {
          display: flex;
          gap: 12px;
        }
        .meta-select {
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          padding: 6px 12px !important;
          color: #a78bfa !important;
          font-size: 0.85rem !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
        }
        .meta-select:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(167, 139, 250, 0.5) !important;
        }
        textarea {
          min-height: 120px;
          resize: vertical;
          line-height: 1.5;
        }
        .image-upload-wrapper {
          border: 2px dashed rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-lg);
          padding: var(--spacing-xl);
          min-height: 160px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.02);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .image-upload-wrapper:hover {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          transform: translateY(-2px);
        }
        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          color: #818cf8;
          font-weight: 600;
        }
        .image-preview-container {
          position: relative;
          width: 100%;
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .preview-image {
          width: 100%;
          max-height: 300px;
          object-fit: contain;
          display: block;
        }
        .hidden-file-input {
          display: none;
        }
        .remove-image-btn {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          border: none;
          padding: 8px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          backdrop-filter: blur(4px);
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
          transition: transform 0.2s;
        }
        .remove-image-btn:hover {
          transform: scale(1.1);
        }

        .math-preview-box {
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 8px;
          padding: 12px;
          margin-top: -4px;
          font-size: 1.1rem;
          color: white;
        }

        .math-preview-box.mini {
          padding: 8px;
          font-size: 0.95rem;
        }

        .preview-label {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #a78bfa;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          opacity: 0.8;
        }

        .option-input-container {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .option-input-container input {
          flex: 1;
        }

        .btn-option-delete {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-option-delete:hover {
          background: #ef4444;
          color: white;
          transform: scale(1.1);
        }

        .add-option-container {
          display: flex;
          align-items: flex-end;
          padding-bottom: var(--spacing-lg);
        }

        .btn-add-option-glass {
          background: rgba(99, 102, 241, 0.1);
          color: #818cf8;
          border: 1px dashed rgba(99, 102, 241, 0.3);
          border-radius: 12px;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          width: 100%;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-add-option-glass:hover {
          background: rgba(99, 102, 241, 0.2);
          border-color: #6366f1;
          color: #a78bfa;
          transform: translateY(-2px);
        }

        .label-with-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2px;
        }

        .formatting-toolbar {
          display: flex;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .formatting-toolbar button {
          background: transparent;
          border: none;
          color: #818cf8;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .formatting-toolbar button:hover {
          background: rgba(99, 102, 241, 0.2);
          color: #a78bfa;
          transform: scale(1.1);
        }

        .question-image-preview {
          position: relative;
          margin-top: 1rem;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.2);
          max-width: 100%;
          display: inline-block;
        }

        .question-image-preview img {
          display: block;
          max-width: 100%;
          max-height: 250px;
          object-fit: contain;
        }

        .remove-image-pill {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(239, 68, 68, 0.9);
          border: none;
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          backdrop-filter: blur(4px);
          transition: all 0.2s;
        }

        .remove-image-pill:hover {
          background: #ef4444;
          transform: scale(1.05);
        }

        .image-upload-area {
          width: 100%;
        }

        .upload-placeholder-compact {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px dashed rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #818cf8;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .upload-placeholder-compact:hover {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
          color: #a78bfa;
        }
      `}</style>
    </div>
  );
};

export default QuestionForm;
