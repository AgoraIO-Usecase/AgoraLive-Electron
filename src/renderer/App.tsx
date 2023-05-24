import React, { useState } from 'react'
import {
  BrowserRouter as Router,
  Link,
  Route,
  Switch,
  Redirect
} from 'react-router-dom';
import { Layout, Menu } from 'antd'
import { GithubOutlined, SettingOutlined } from '@ant-design/icons';
const { Content, Footer, Sider } = Layout;
const { SubMenu, Item } = Menu;
import './App.global.scss';
import AuthInfoScreen from './pages/AuthInfoScreen'
import Combination from './pages/Combination'

const App :React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const renderMenu = () => {
    return (
      <Menu theme="dark" defaultSelectedKeys={['setting']} mode="inline">
        <Item key="setting" icon={<SettingOutlined />}>
          <Link to="/">Setting</Link>
        </Item>
        <SubMenu key="sub1" icon={<GithubOutlined />} title="Function Show">
          <Item key="combination" icon={<SettingOutlined />}>
            <Link to="/combination">Composite Picture</Link>
          </Item>
        </SubMenu>
      </Menu>
    )
  }

  const renderContent = () => {
    return (
      <Switch>
        <Route path="/" children={<AuthInfoScreen />} exact={true} />
        <Route path="/combination" children={<Combination />} />
        <Route path="*">
          <Redirect to="/" />
        </Route>
      </Switch>
    )
  }

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
          {renderMenu()}
        </Sider>
        <Layout className='site-layout'>
          <Content style={{ flex: 1, overflow: 'auto' }}>
            { renderContent() }
          </Content>
        </Layout>
      </Layout>
    </Router>
  )
}
export default App