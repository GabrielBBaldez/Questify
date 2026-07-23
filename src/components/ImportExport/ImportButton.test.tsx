import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportButton } from './ImportButton';

function quizFile(name: string, title: string): File {
  const quiz = {
    title,
    questions: [
      {
        type: 'multiple_choice',
        text: 'q',
        alternatives: [
          { id: 'A', text: 'a' },
          { id: 'B', text: 'b' },
        ],
        correctAnswer: 'A',
      },
    ],
  };
  return new File([JSON.stringify(quiz)], name, { type: 'application/json' });
}

function fileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

describe('ImportButton', () => {
  it('imports several JSON files at once', async () => {
    const onImport = vi.fn();
    const { container } = render(<ImportButton onImport={onImport} />);

    await userEvent.upload(fileInput(container), [
      quizFile('a.json', 'Banco A'),
      quizFile('b.json', 'Banco B'),
      quizFile('c.json', 'Banco C'),
    ]);

    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
    const quizzes = onImport.mock.calls[0][0];
    expect(quizzes).toHaveLength(3);
    expect(quizzes.map((q: { title: string }) => q.title)).toEqual(['Banco A', 'Banco B', 'Banco C']);
    expect(await screen.findByText(/3 bancos importados/i)).toBeInTheDocument();
  });

  it('imports the valid files and reports the invalid ones', async () => {
    const onImport = vi.fn();
    const { container } = render(<ImportButton onImport={onImport} />);

    const bad = new File(['{ not valid json'], 'bad.json', { type: 'application/json' });
    await userEvent.upload(fileInput(container), [quizFile('good.json', 'Bom'), bad]);

    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
    expect(onImport.mock.calls[0][0]).toHaveLength(1);
    expect(await screen.findByText(/com erro/i)).toBeInTheDocument();
  });
});
