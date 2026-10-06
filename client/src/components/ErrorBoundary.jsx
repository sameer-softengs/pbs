import { Component } from 'react';
export default class ErrorBoundary extends Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error){console.error('Application rendering failed:',error.message);}
  render(){
    if(this.state.failed)return <main className="app-fallback" role="alert"><img src="/logo.svg" width="64" height="64" alt="PBS"/><h1>We couldn’t open this view.</h1><p>Refresh the app to try again. Your route directory will remain available.</p><button className="primary-button" onClick={()=>window.location.reload()}>Reload app</button></main>;
    return this.props.children;
  }
}
