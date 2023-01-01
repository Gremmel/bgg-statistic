import AppHeader from '@/components/AppHeader.vue';
import { shallowMount } from '@vue/test-utils';

describe('AppHeader.vue', () => {
  it('renders props.msg when passed', () => {
    const wrapper = shallowMount(AppHeader);

    expect(wrapper.text()).toMatch('Kopfzeile ->');
  });
});
