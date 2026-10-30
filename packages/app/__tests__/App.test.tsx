import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../src/App';

test('starts with onboarding on first launch', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });

  const text = JSON.stringify(renderer!.toJSON());
  expect(text).toContain('Flyable or not, hour by hour.');
  expect(text).toContain('The score is a guide only.');
});
